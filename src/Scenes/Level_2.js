class Level_2 extends Phaser.Scene {
    constructor() {
        super("level2");
        this.my = {sprite: {}, text: {}};
        this.attackSpeed = 250; // Attack speed in milliseconds
        this.lastFired = 0; // When the last bullet was fired
        this.myScore = 0; // Initialize score
        this.enemySpawnTimer = 0;
        this.enemyGroup = []; // To track all enemy ships
        this.enemyScorePoints = 10;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("player", "playerShip1_green.png");
        this.load.image("laserG2", "laserGreen02.png");
        this.load.image("enemyufo", "ufoRed.png");
        this.load.image("laserR09", "laserRed09.png");
         // For animation
         this.load.image("whitePuff00", "laserGreen01.png");
         this.load.image("whitePuff01", "laserGreen14.png");
         this.load.image("whitePuff02", "laserGreen15.png");
         this.load.image("whitePuff03", "laserGreen16.png");
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        // NEWLY ADDED, For audio
        this.load.audio("enemyDeath", "lowFrequency_explosion_000.ogg");
        this.load.audio("laserSound", "laserLarge_000.ogg");
    }

    create() {
        let my = this.my;
        my.sprite.player = this.add.sprite(game.config.width / 2, game.config.height - 40, "player").setScale(0.5);
        my.text.score = this.add.bitmapText(950, 0, "rocketSquare", "Score: " + this.myScore);
        my.sprite.bullet = [];
        this.enemyLasers = [];
    
        // this.levelText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 4, 'LEVEL 1', { font: '64px Arial', fill: '#FFFFFF' }).setOrigin(0.5);
        this.levelText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 4, 'LEVEL 2', { font: '64px Arial', fill: '#FFFFFF' }).setOrigin(0.5);
        this.time.delayedCall(1000, () => {
            this.levelText.setVisible(false);
        }, [], this);

    
        this.setupAnimations();
        this.setupControls();
    
        // Spawn exactly 10 enemies
        for (let i = 0; i < 10; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        let x = Phaser.Math.Between(50, this.cameras.main.width - 50);
        let startY = -50; // Start above the screen
        let stopY = Phaser.Math.Between(50, this.cameras.main.height / 2 - 50);
    
        // Use 'follower' to ensure the sprite can follow a path
        let enemy = new Phaser.GameObjects.PathFollower(this, null, x, startY, "enemyufo");
        enemy.setScale(0.5);
        this.add.existing(enemy); // Add to scene
        this.enemyGroup.push(enemy);
    
        this.tweens.add({
            targets: enemy,
            y: stopY,
            ease: 'Power1',
            duration: 2000,
            onComplete: () => {
                this.tweenEnemySPath(enemy, stopY);
            }
        });
        this.scheduleEnemyFire(enemy);
    }
    
    tweenEnemySPath(enemy, stopY) {
        let path = new Phaser.Curves.Path(enemy.x, stopY);
        path.splineTo([
            { x: enemy.x + 100, y: stopY + 100 },
            { x: enemy.x - 100, y: stopY + 200 },
            { x: enemy.x + 100, y: stopY + 300 },
            { x: enemy.x - 100, y: stopY + 400 }
        ]);
    
        enemy.setPath(path, true);
        enemy.startFollow({
            duration: 8000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    setupAnimations() {
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,
            repeat: 3,
            hideOnComplete: true
        });
    }

    setupControls() {
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.playerSpeed = 5;
        this.bulletSpeed = 10;
    }

    scheduleEnemyFire(enemy) {
        this.time.addEvent({
            delay: 5000,
            callback: () => {
                if (enemy.active) {
                    this.shootLasersFromEnemy(enemy);
                }
            },
            callbackScope: this,
            loop: true
        });
    }       

    shootLasersFromEnemy(enemy) {
        const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, // Right, Left
            { x: 0, y: 1 }, { x: 0, y: -1 }, // Down, Up
            { x: 1, y: 1 }, { x: -1, y: 1 }, // Down-right, Down-left
            { x: 1, y: -1 }, { x: -1, y: -1 } // Up-right, Up-left
        ];
    
        directions.forEach(direction => {
            let laser = this.add.sprite(enemy.x, enemy.y, "laserR09").setScale(0.5);
            this.enemyLasers.push(laser);
            this.tweens.add({
                targets: laser,
                x: laser.x + direction.x * 300, // Adjust length as needed
                y: laser.y + direction.y * 300,
                ease: 'Linear',
                duration: 1500,
                onComplete: () => {
                    laser.destroy();
                }
            });
        });
    }          

    update(time, delta) {
        this.handlePlayerMovement();
        this.handleFiring(time);
        this.updateBullets();
        this.checkCollisions();
    }

    handlePlayerMovement() {
        let my = this.my;
        if (this.left.isDown && my.sprite.player.x > (my.sprite.player.displayWidth / 2)) {
            my.sprite.player.x -= this.playerSpeed;
        }
        if (this.right.isDown && my.sprite.player.x < (game.config.width - (my.sprite.player.displayWidth / 2))) {
            my.sprite.player.x += this.playerSpeed;
        }
    }

    handleFiring(time) {
        let my = this.my;
        if (this.space.isDown && time > this.lastFired) {
            let bullet = this.add.sprite(my.sprite.player.x, my.sprite.player.y - my.sprite.player.displayHeight, "laserG2");
            bullet.setScale(0.5);
            my.sprite.bullet.push(bullet);
            this.lastFired = time + this.attackSpeed;
            this.sound.play("laserSound", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
        }
    }

    updateBullets() {
        let my = this.my;
        // Update player bullets
        my.sprite.bullet.forEach(bullet => {
            bullet.y -= this.bulletSpeed;
            if (bullet.y < -(bullet.displayHeight / 2)) {
                bullet.destroy();
            }
        });
    
        // Update enemy lasers
        this.enemyLasers.forEach(laser => {
            laser.y += this.bulletSpeed - 5; // Enemy lasers move downward
            if (laser.y > this.game.config.height + laser.displayHeight / 2) {
                laser.destroy();
            }
        });
    }     

    checkCollisions() {
        let my = this.my;
    
        // Player bullets with enemies
        my.sprite.bullet.forEach(bullet => {
            this.enemyGroup.forEach(enemy => {
                if (enemy.active && bullet.active && this.collides(enemy, bullet)) {
                    this.puff = this.add.sprite(enemy.x, enemy.y, "whitePuff03").setScale(0.75).play("puff");
                    bullet.destroy();
                    // Inside checkCollisions, where an enemy is destroyed:
                    enemy.destroy();
                    this.sound.play("enemyDeath");
                    this.myScore += this.enemyScorePoints;
                    this.updateScore();
                    // console.log("added");
                    this.enemyGroup.splice(this.enemyGroup.indexOf(enemy), 1); // Remove from tracking array

                }
            });
        });
    
        // Enemy lasers with player
        this.enemyLasers.forEach(laser => {
            if (laser.active && this.collides(my.sprite.player, laser)) {
                laser.destroy();
                this.playerDeath(); // Handle player death
                this.myScore = 0;
            }
        });
    
        // Player collides with enemy
        this.enemyGroup.forEach(enemy => {
            if (enemy.active && this.collides(my.sprite.player, enemy)) {
                this.playerDeath(); // Handle player death
                this.myScore = 0;
            }
        });
    }

    playerDeath() {
        this.sound.play("enemyDeath", {
            volume: 1   // Can adjust volume using this, goes from 0 to 1
        });
        // Play explosion animation or sound
        this.add.sprite(this.my.sprite.player.x, this.my.sprite.player.y, "whitePuff03").setScale(0.75).play("puff");
        
        // Disable player controls and other interactions here
        this.my.sprite.player.setVisible(false);  // Optionally hide the player
    
        // Wait 1 second before switching to the EndScene
        this.time.delayedCall(1000, () => {
            this.scene.start('EndScene'); // Transition to EndScene after delay
        }, [], this);
    }       
    
    collides(a, b) {
        // Simple AABB collision detection
        return Math.abs(a.x - b.x) < (a.displayWidth / 2 + b.displayWidth / 2) &&
               Math.abs(a.y - b.y) < (a.displayHeight / 2 + b.displayHeight / 2);
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score: " + this.myScore);
        console.log("added");
    
        if (this.myScore === 100) {
            this.scene.start('EndScene');
        }
    }
    
}
