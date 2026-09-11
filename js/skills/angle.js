import { Skill } from './base.js';

// Angle Estimation Skill
export class AngleEstimationSkill extends Skill {
    constructor() {
        super('angle-estimation', 'Angle Estimation');
    }

    generateTrial() {
        const angle = Math.floor(Math.random() * 180); // 0 to 180 degrees
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Draw angle
        ctx.clearRect(0, 0, 300, 300);
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.lineTo(250, 150);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const radians = angle * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.lineTo(150 + 100 * Math.cos(radians), 150 - 100 * Math.sin(radians));
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // A canvas serialized with outerHTML arrives on screen blank - the
        // bitmap isn't part of the markup. Export it as an image instead.
        return {
            question: 'Estimate the angle in degrees:',
            inputHTML: `<img class="figure" src="${canvas.toDataURL()}" width="300" height="300" alt="angle">` +
                '<input type="number" id="answerInput" placeholder="degrees" min="0" max="180">',
            correctAnswer: angle
        };
    }

    checkAnswer(trial, answer) {
        const userAnswer = parseFloat(answer);
        const correct = trial.correctAnswer;
        const diff = Math.abs(userAnswer - correct);
        const isCorrect = diff <= 5; // within 5° counts as correct

        let score = 0;
        if (diff <= 5) score = 1;
        else if (diff <= 10) score = 0.6;
        else if (diff <= 20) score = 0.3;

        const feedback = isCorrect
            ? `${correct}° (you said ${userAnswer}°, off by ${diff}° — within the 5° margin)`
            : `Off by ${diff}°. Correct answer: ${correct}° (you said ${userAnswer}°)`;

        return { score, correct: isCorrect, feedback };
    }
}
