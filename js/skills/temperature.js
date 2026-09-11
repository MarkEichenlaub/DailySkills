import { Skill } from './base.js';

// Fahrenheit to Celsius Skill
export class FahrenheitToCelsiusSkill extends Skill {
    constructor() {
        super('f-to-c', 'Fahrenheit to Celsius');
    }

    generateTrial() {
        const fahrenheit = Math.floor(Math.random() * 180) - 40; // -40 to 140
        return {
            question: `${fahrenheit}°F = ? °C`,
            inputHTML: '<input type="number" id="answerInput" placeholder="°C" step="0.1">',
            correctAnswer: ((fahrenheit - 32) * 5 / 9)
        };
    }

    checkAnswer(trial, answer) {
        const userAnswer = parseFloat(answer);
        const correct = trial.correctAnswer;
        const diff = Math.abs(userAnswer - correct);
        const isCorrect = diff <= 1; // within 1°C counts as correct

        let score = 0;
        if (diff <= 1) score = 1;
        else if (diff <= 2) score = 0.6;
        else if (diff <= 5) score = 0.3;

        const feedback = isCorrect
            ? `${correct.toFixed(1)}°C (you said ${userAnswer.toFixed(1)}°C, off by ${diff.toFixed(1)}° — within the 1° margin)`
            : `Off by ${diff.toFixed(1)}°. Correct answer: ${correct.toFixed(1)}°C (you said ${userAnswer.toFixed(1)}°C)`;

        return { score, correct: isCorrect, feedback };
    }
}

// Celsius to Fahrenheit Skill
export class CelsiusToFahrenheitSkill extends Skill {
    constructor() {
        super('c-to-f', 'Celsius to Fahrenheit');
    }

    generateTrial() {
        const celsius = Math.floor(Math.random() * 100) - 40; // -40 to 60
        return {
            question: `${celsius}°C = ? °F`,
            inputHTML: '<input type="number" id="answerInput" placeholder="°F" step="0.1">',
            correctAnswer: (celsius * 9 / 5 + 32)
        };
    }

    checkAnswer(trial, answer) {
        const userAnswer = parseFloat(answer);
        const correct = trial.correctAnswer;
        const diff = Math.abs(userAnswer - correct);
        const isCorrect = diff <= 2; // within 2°F counts as correct

        let score = 0;
        if (diff <= 2) score = 1;
        else if (diff <= 4) score = 0.6;
        else if (diff <= 10) score = 0.3;

        const feedback = isCorrect
            ? `${correct.toFixed(1)}°F (you said ${userAnswer.toFixed(1)}°F, off by ${diff.toFixed(1)}° — within the 2° margin)`
            : `Off by ${diff.toFixed(1)}°. Correct answer: ${correct.toFixed(1)}°F (you said ${userAnswer.toFixed(1)}°F)`;

        return { score, correct: isCorrect, feedback };
    }
}
