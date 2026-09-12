import { db, auth } from './firebase.js';
import { createSkills } from './skills/index.js';

// A phone has no keys to press, so the skills that are about pressing keys are
// hidden there rather than offered and then failed. A tablet with a keyboard or
// a trackpad attached reports a fine pointer, and counts as a real computer.
export function isTouchOnly() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(pointer: coarse)').matches
        && !window.matchMedia('(any-pointer: fine)').matches;
}

// Times are shown as seconds, since every trial here is a few seconds long.
export function fmtSeconds(ms) {
    if (ms == null) return '-';
    return (ms / 1000).toFixed(1) + 's';
}

// Core App Class
export class SkillPracticeApp {
    constructor() {
        this.skills = [];
        this.currentSkill = null;
        this.sessionStartTime = null;
        this.sessionEndTime = null;
        this.timerInterval = null;
        this.practiceTimeSeconds = 300; // 5 minutes
        this.remainingSeconds = this.practiceTimeSeconds;
        this.currentTrial = null;
        this.sessionData = {
            trials: 0,
            correct: 0,
            totalScore: 0
        };
        this.userData = {
            totalTrials: 0,
            streak: 0,
            lastPracticeDate: null,
            todayMinutes: 0
        };
        this.advanceListener = null;
        this.firebaseUser = null;

        this.loadUserData();
        this.registerSkills();
        this.updateUI();
        this.initAuth();
        this.checkUrlSkill();
    }

    // A skill can be linked/bookmarked directly via ?skill=<id> - jump
    // straight into practicing it instead of showing the home screen.
    checkUrlSkill() {
        const skillId = new URLSearchParams(location.search).get('skill');
        if (!skillId) return;
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return;
        // A bookmark for a keyboard skill opened on a phone stays on the home
        // screen and says why, rather than starting something unplayable.
        if (skill.needsKeyboard && isTouchOnly()) {
            this.showNotice(`${skill.name} needs a keyboard. Open it on a computer.`);
            this.updateUrlForSkill(null);
            return;
        }
        this.startPractice(skillId);
    }

    showNotice(text) {
        const el = document.getElementById('notice');
        if (!el) return;
        el.textContent = text;
        el.classList.remove('hidden');
    }

    // The skills that can actually be practiced on this device.
    availableSkills() {
        const touch = isTouchOnly();
        return this.skills.filter(s => !(s.needsKeyboard && touch));
    }

    updateUrlForSkill(skillId) {
        const url = skillId ? `?skill=${encodeURIComponent(skillId)}` : location.pathname;
        history.replaceState(null, '', url);
    }

    initAuth() {
        if (!auth) {
            // Firebase not configured, show nothing
            document.getElementById('signInBtn').style.display = 'none';
            return;
        }

        auth.onAuthStateChanged(async (user) => {
            this.firebaseUser = user;
            const signInBtn = document.getElementById('signInBtn');
            const signOutBtn = document.getElementById('signOutBtn');
            const userName = document.getElementById('userName');

            if (user) {
                signInBtn.style.display = 'none';
                userName.textContent = user.displayName || user.email;
                userName.style.display = 'inline';
                signOutBtn.style.display = 'inline';
                await this.loadFromFirestore();
            } else {
                signInBtn.style.display = 'inline';
                userName.style.display = 'none';
                signOutBtn.style.display = 'none';
                this.setSyncStatus('');
            }
        });

        // signInWithPopup is unreliable here - a browser's built-in popup
        // blocker (or Brave's Shields) can silently swallow the popup with
        // no visible error, which is exactly what looked like "nothing
        // happens". signInWithRedirect avoids popups entirely: the whole
        // page navigates to Google and back. This picks up the result of
        // that round trip.
        auth.getRedirectResult().catch((e) => {
            console.error('Sign-in redirect error:', e);
            this.setSyncStatus('sign-in failed: ' + (e.code || e.message));
        });
    }

    async signIn() {
        if (!auth) return;
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            this.setSyncStatus('redirecting to Google...');
            await auth.signInWithRedirect(provider);
        } catch (e) {
            console.error('Sign-in error:', e);
            this.setSyncStatus('sign-in failed: ' + (e.code || e.message));
        }
    }

    async signOut() {
        if (!auth) return;
        try {
            await auth.signOut();
        } catch (e) {
            console.error('Sign-out error:', e);
        }
    }

    setSyncStatus(text) {
        document.getElementById('syncStatus').textContent = text;
    }

    registerSkills() {
        this.skills = createSkills();
    }

    loadUserData() {
        const saved = localStorage.getItem('skillPracticeData');
        if (saved) {
            const data = JSON.parse(saved);
            this.userData = data.userData || this.userData;

            // Load skill data
            if (data.skills) {
                this.skills.forEach(skill => {
                    if (data.skills[skill.id]) {
                        skill.loadData(data.skills[skill.id]);
                    }
                });
            }

            // Update streak
            const today = new Date().toDateString();
            const lastDate = this.userData.lastPracticeDate;

            if (lastDate === today) {
                // Already practiced today
            } else if (lastDate) {
                const last = new Date(lastDate);
                const now = new Date();
                const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Continue streak
                } else if (diffDays > 1) {
                    // Streak broken
                    this.userData.streak = 0;
                }
            }

            // Reset daily minutes if new day
            if (lastDate !== today) {
                this.userData.todayMinutes = 0;
            }
        }
    }

    getDataSnapshot() {
        const data = {
            userData: this.userData,
            skills: {}
        };
        this.skills.forEach(skill => {
            data.skills[skill.id] = skill.getData();
        });
        return data;
    }

    saveUserData() {
        const data = this.getDataSnapshot();
        localStorage.setItem('skillPracticeData', JSON.stringify(data));
        this.saveToFirestore(data);
    }

    async saveToFirestore(data) {
        if (!db || !this.firebaseUser) return;
        try {
            this.setSyncStatus('syncing...');
            await db.collection('users').doc(this.firebaseUser.uid)
                .collection('data').doc('progress')
                .set(data);
            this.setSyncStatus('synced');
        } catch (e) {
            console.error('Firestore save error:', e);
            this.setSyncStatus('sync error');
        }
    }

    async loadFromFirestore() {
        if (!db || !this.firebaseUser) return;
        try {
            this.setSyncStatus('loading...');
            const doc = await db.collection('users').doc(this.firebaseUser.uid)
                .collection('data').doc('progress')
                .get();

            if (doc.exists) {
                const cloudData = doc.data();
                const localData = this.getDataSnapshot();
                const merged = this.mergeData(localData, cloudData);

                // Apply merged data
                this.userData = merged.userData;
                if (merged.skills) {
                    this.skills.forEach(skill => {
                        if (merged.skills[skill.id]) {
                            skill.loadData(merged.skills[skill.id]);
                        }
                    });
                }

                // Save merged result to both stores
                localStorage.setItem('skillPracticeData', JSON.stringify(merged));
                await db.collection('users').doc(this.firebaseUser.uid)
                    .collection('data').doc('progress')
                    .set(merged);

                this.updateUI();
                this.setSyncStatus('synced');
            } else {
                // No cloud data yet, push local data up
                await this.saveToFirestore(this.getDataSnapshot());
            }
        } catch (e) {
            console.error('Firestore load error:', e);
            this.setSyncStatus('sync error');
        }
    }

    mergeData(local, cloud) {
        // Simple merge: whichever source has more totalTrials wins
        const localTrials = (local.userData && local.userData.totalTrials) || 0;
        const cloudTrials = (cloud.userData && cloud.userData.totalTrials) || 0;
        return cloudTrials >= localTrials ? cloud : local;
    }

    async resetAllData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            localStorage.removeItem('skillPracticeData');
            if (db && this.firebaseUser) {
                try {
                    await db.collection('users').doc(this.firebaseUser.uid)
                        .collection('data').doc('progress')
                        .delete();
                } catch (e) {
                    console.error('Firestore delete error:', e);
                }
            }
            location.reload();
        }
    }

    updateUI() {
        // Update stats
        document.getElementById('todayTime').textContent = Math.floor(this.userData.todayMinutes);
        document.getElementById('streak').textContent = this.userData.streak;
        document.getElementById('totalTrials').textContent = this.userData.totalTrials;

        // Update skill list
        const skillList = document.getElementById('skillList');
        skillList.innerHTML = '';

        this.availableSkills().forEach(skill => {
            const skillData = skill.getData();
            const item = document.createElement('div');
            item.className = 'skill-item';
            item.innerHTML = `
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-stats">
                        Trials: ${skillData.totalTrials} |
                        Accuracy: ${skillData.totalTrials > 0 ?
                            Math.round(skillData.correctTrials / skillData.totalTrials * 100) : 0}%${
                        skillData.bestMs != null ? ` | Best: ${fmtSeconds(skillData.bestMs)}` : ''}${
                        skill.recentMedianMs && skill.recentMedianMs() != null ?
                            ` | Typical: ${fmtSeconds(skill.recentMedianMs())}` : ''}
                    </div>
                </div>
            `;
            item.addEventListener('click', () => this.startPractice(skill.id));
            skillList.appendChild(item);
        });
    }

    chooseSkill() {
        // Simple algorithm: choose skill that has been practiced least recently
        // or has lowest proficiency relative to goal
        
        const pool = this.availableSkills();
        let bestSkill = pool[0];
        let bestScore = -Infinity;

        pool.forEach(skill => {
            const data = skill.getData();
            const recencyScore = data.lastPracticed ? 
                (Date.now() - new Date(data.lastPracticed)) / (1000 * 60 * 60 * 24) : 999;
            const proficiencyGap = 1 - (data.totalTrials > 0 ? 
                data.correctTrials / data.totalTrials : 0);
            
            const score = recencyScore + proficiencyGap * 5;
            
            if (score > bestScore) {
                bestScore = score;
                bestSkill = skill;
            }
        });
        
        return bestSkill;
    }

    startPractice(skillId) {
        const named = skillId ? this.skills.find(s => s.id === skillId) : null;
        if (named && named.needsKeyboard && isTouchOnly()) {
            this.showNotice(`${named.name} needs a keyboard. Open it on a computer.`);
            return;
        }
        this.currentSkill = named || this.chooseSkill();
        this.updateUrlForSkill(this.currentSkill.id);
        this.sessionStartTime = Date.now();
        this.remainingSeconds = this.practiceTimeSeconds;
        this.sessionData = {
            trials: 0,
            correct: 0,
            totalScore: 0,
            times: []
        };

        document.getElementById('homeScreen').classList.remove('active');
        document.getElementById('practiceScreen').classList.add('active');
        document.getElementById('currentSkillName').textContent = this.currentSkill.name;
        
        this.updateSessionStats();
        this.startTimer();
        this.nextTrial();
    }

    startTimer() {
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            this.updateTimerDisplay();
            
            if (this.remainingSeconds <= 0) {
                this.endPractice();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        document.getElementById('practiceTimer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    pausePractice() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            alert('Practice paused. Click OK to resume.');
            this.startTimer();
        }
    }

    endPractice() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Update user data
        const sessionMinutes = (Date.now() - this.sessionStartTime) / (1000 * 60);
        this.userData.todayMinutes += sessionMinutes;
        this.userData.totalTrials += this.sessionData.trials;
        
        const today = new Date().toDateString();
        if (this.userData.lastPracticeDate !== today) {
            if (this.userData.lastPracticeDate) {
                const last = new Date(this.userData.lastPracticeDate);
                const now = new Date();
                const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    this.userData.streak++;
                } else {
                    this.userData.streak = 1;
                }
            } else {
                this.userData.streak = 1;
            }
            this.userData.lastPracticeDate = today;
        }
        
        this.saveUserData();
        this.updateUrlForSkill(null);

        // Return to home
        document.getElementById('practiceScreen').classList.remove('active');
        document.getElementById('homeScreen').classList.add('active');
        this.updateUI();
        
        const times = this.sessionData.times;
        const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
        alert(`Practice complete!\n\nTrials: ${this.sessionData.trials}\n`
            + `Correct: ${this.sessionData.correct}\n`
            + `Accuracy: ${this.sessionData.trials > 0 ? Math.round(this.sessionData.correct / this.sessionData.trials * 100) : 0}%\n`
            + `Average time when right: ${fmtSeconds(avg)}`);
    }

    nextTrial() {
        // Remove any existing keyboard listener
        if (this.advanceListener) {
            document.removeEventListener('keypress', this.advanceListener);
            this.advanceListener = null;
        }
        if (this.choiceKeyListener) {
            document.removeEventListener('keydown', this.choiceKeyListener);
            this.choiceKeyListener = null;
        }

        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';
        document.getElementById('continueButton').classList.add('hidden');
        
        this.currentTrial = this.currentSkill.generateTrial();
        document.getElementById('questionText').textContent = this.currentTrial.question;

        // An interleaved skill says which kind of question this is, so you're
        // not left guessing what you're being asked for.
        const typeLabel = document.getElementById('trialType');
        if (typeLabel) {
            typeLabel.textContent = this.currentTrial.typeName || '';
            typeLabel.style.display = this.currentTrial.typeName ? '' : 'none';
        }

        const inputArea = document.getElementById('inputArea');
        inputArea.innerHTML = this.currentTrial.inputHTML;

        if (this.currentSkill.onTrialRendered) {
            this.currentSkill.onTrialRendered(this.currentTrial, inputArea, this);
        }

        // Start the clock only once the question is on screen.
        this.trialStartTime = Date.now();

        // Multiple choice: click an option to answer, or press its number key.
        const choices = inputArea.querySelectorAll('.choice input[type="radio"]');
        if (choices.length) {
            choices.forEach((radio) => {
                radio.addEventListener('change', () => this.submitAnswer());
            });
            this.choiceKeyListener = (e) => {
                const n = parseInt(e.key, 10);
                if (n >= 1 && n <= choices.length) {
                    e.preventDefault();
                    choices[n - 1].checked = true;
                    this.submitAnswer();
                }
            };
            document.addEventListener('keydown', this.choiceKeyListener);
            return;
        }

        // Focus input
        const input = inputArea.querySelector('input, textarea');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    // Stop this Enter keypress from also bubbling to the
                    // document-level "advance to next trial" listener that
                    // submitAnswer() is about to attach - otherwise the
                    // same keystroke both submits AND advances, and the
                    // feedback banner never has a chance to be seen.
                    e.stopPropagation();
                    this.submitAnswer();
                }
            });
        }
    }

    submitAnswer() {
        const inputArea = document.getElementById('inputArea');
        const checked = inputArea.querySelector('.choice input[type="radio"]:checked');
        const input = checked || inputArea.querySelector('input, textarea');
        // Number/text inputs shouldn't submit empty - skills that drive
        // submission themselves (textarea/quiz-based) never hit this case.
        if (!checked && input && input.tagName === 'INPUT' && input.value.trim() === '') return;

        const elapsedMs = this.trialStartTime ? Date.now() - this.trialStartTime : null;
        this.trialStartTime = null;
        if (this.choiceKeyListener) {
            document.removeEventListener('keydown', this.choiceKeyListener);
            this.choiceKeyListener = null;
        }

        const answer = input ? input.value : '';
        const result = this.currentSkill.checkAnswer(this.currentTrial, answer);

        this.sessionData.trials++;
        this.sessionData.totalScore += result.score;
        if (result.correct) {
            this.sessionData.correct++;
            if (elapsedMs != null) this.sessionData.times.push(elapsedMs);
        }

        const prevBest = this.currentSkill.getData().bestMs;
        this.currentSkill.recordTrial(result.score, elapsedMs, this.currentTrial.tag);
        const newBest = result.correct && elapsedMs != null &&
            (prevBest == null || elapsedMs < prevBest);
        this.updateSessionStats();

        // Show feedback - clear, immediate, and skill-agnostic: green means
        // right, red means wrong, and the correct answer is always shown.
        const feedback = document.getElementById('feedback');
        const timeTag = elapsedMs == null ? '' :
            `<span class="feedback-time">${fmtSeconds(elapsedMs)}${newBest ? ' — best yet' : ''}</span>`;
        if (result.correct) {
            feedback.innerHTML = `✓ Correct! ${result.feedback}${timeTag}`;
            feedback.className = 'feedback correct';
        } else {
            feedback.innerHTML = `✗ ${result.feedback}${timeTag}`;
            feedback.className = 'feedback incorrect';
        }

        // Disable input
        if (input) input.disabled = true;
        inputArea.querySelectorAll('.choice input[type="radio"]').forEach(r => { r.disabled = true; });

        // Show continue button
        document.getElementById('continueButton').classList.remove('hidden');
        document.getElementById('continueButton').focus();

        // Set up keyboard listener for advancing. Delayed by a tick: the
        // Enter that triggered this submitAnswer() call (e.g. "give up" in
        // the keyboard-shortcuts skill, where Enter itself is both the
        // graded action and the natural submit key) can still produce its
        // own trailing keypress/keyup after this function returns - if the
        // listener were live already, that same keystroke would instantly
        // advance past the feedback the user just triggered.
        setTimeout(() => {
            this.advanceListener = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.removeEventListener('keypress', this.advanceListener);
                    this.advanceListener = null;
                    this.nextTrial();
                }
            };
            document.addEventListener('keypress', this.advanceListener);
        }, 0);
    }

    updateSessionStats() {
        document.getElementById('sessionTrials').textContent = this.sessionData.trials;
        document.getElementById('sessionCorrect').textContent = this.sessionData.correct;
        document.getElementById('sessionAccuracy').textContent = 
            this.sessionData.trials > 0 ? 
            Math.round(this.sessionData.correct / this.sessionData.trials * 100) + '%' : '-';
        document.getElementById('sessionAvgScore').textContent =
            this.sessionData.trials > 0 ?
            (this.sessionData.totalScore / this.sessionData.trials).toFixed(2) : '-';

        const times = this.sessionData.times;
        const avgEl = document.getElementById('sessionAvgTime');
        if (avgEl) {
            avgEl.textContent = times.length
                ? fmtSeconds(times.reduce((a, b) => a + b, 0) / times.length) : '-';
        }
        const bestEl = document.getElementById('skillBestTime');
        if (bestEl && this.currentSkill) {
            bestEl.textContent = fmtSeconds(this.currentSkill.getData().bestMs);
        }
    }
}
