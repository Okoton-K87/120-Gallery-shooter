class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }

    create() {
        this.add.text(550, 300, 'Game Over', { fill: '#ff0000' });
        let restartButton = this.add.text(550, 500, 'Main Menu', { fill: '#0f0' })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('MainMenu'); // Go back to the main menu
            });
    }
}
