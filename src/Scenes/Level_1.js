class Level_1 extends Phaser.Scene {
    constructor() {
        super("level1");
        this.my = {sprite: {}, text: {}};
        this.attackSpeed = 500; // Attack speed in milliseconds
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
        this.load.image("enemyB1", "enemyBlack1.png");
        this.load.image("laserR12", "laserRed05.png");
         // For animation
         this.load.image("whitePuff00", "laserGreen01.png");
         this.load.image("whitePuff01", "laserGreen14.png");
         this.load.image("whitePuff02", "laserGreen15.png");
         this.load.image("whitePuff03", "laserGreen16.png");
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");
    }

    create() {
        let my = this.my;
        my.sprite.player = this.add.sprite(game.config.width / 2, game.config.height - 40, "player").setScale(0.5);
        my.text.score = this.add.bitmapText(950, 0, "rocketSquare", "Score: " + this.myScore);

        my.sprite.bullet = []; // Ensure this is initialized here
        this.enemyLasers = [];
        // my.sprite.enemy.scorePoints = 10; 

        this.setupAnimations();
        this.setupControls();

        // Start spawning enemies
        this.time.addEvent({
            delay: 2000,                // every 2 seconds
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
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

    spawnEnemies() {
        let numEnemies = Phaser.Math.Between(1, 2);
        for (let i = 0; i < numEnemies; i++) {
            let x = Phaser.Math.Between(0, this.cameras.main.width);
            let enemy = this.add.sprite(x, -50, "enemyB1").setScale(0.5);
            this.enemyGroup.push(enemy);
            this.tweenEnemy(enemy);
            this.scheduleEnemyFire(enemy);
        }
    }

    scheduleEnemyFire(enemy) {
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 3000), // Random firing delay
            callback: () => {
                if (enemy.active) {
                    let laser = this.add.sprite(enemy.x, enemy.y, "laserR12").setScale(0.5);
                    // laser.tint = 0xff0000; // Color the enemy laser red for clarity
                    this.enemyLasers.push(laser);
                }
            },
            callbackScope: this,
            loop: true
        });
    }    

    tweenEnemy(enemy) {
        let endY = this.cameras.main.height + 50; // Pass through the bottom of the screen
        this.tweens.add({
            targets: enemy,
            y: endY,
            x: Phaser.Math.Between(0, this.cameras.main.width), // Random endpoint x
            ease: 'Sine.easeInOut',
            duration: Phaser.Math.Between(10000, 20000),
            yoyo: false,
            repeat: 0,
            onComplete: () => {
                enemy.destroy(); // Destroy the sprite after the animation
                this.enemyGroup.splice(this.enemyGroup.indexOf(enemy), 1); // Remove from tracking array
            }
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
                    enemy.destroy();
                    this.myScore += this.enemyScorePoints;
                    this.updateScore();
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
    }
}
