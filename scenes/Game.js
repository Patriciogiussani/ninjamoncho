export default class Game extends Phaser.Scene {
  constructor() {
    super("main");
  }

  init() {
    this.gameOver = false;
    this.timer = 30;
    this.score = 0;
    this.shapes = {
      "pelota": { points: 10, count: 0 },
      "taco": { points: 20, count: 0 },
      "copa": { points: 30, count: 0 },
      "curry": { points: -10, count: 0 },
    };
  }

  preload() {
    this.load.image("cielo", "public/assets/cancha.png");
    this.load.image("plataformas", "public/assets/platform.png");
    this.load.image("personaje", "public/assets/lebron.png");
    this.load.image("pelota", "public/assets/pelota.png");
    this.load.image("taco", "public/assets/taco.png");
    this.load.image("copa", "public/assets/trofeo.png");
    this.load.image("curry", "public/assets/curry.png")
  }

  create() {
    this.cielo = this.add.image(400, 300, "cielo");
    this.cielo.setScale(0.8);

    this.plataformas = this.physics.add.staticGroup();
    // Plataforma principal
    this.plataformas.create(400, 568, "plataformas").setScale(2).refreshBody();
    // Nueva plataforma izquierda
    this.plataformas.create(150, 400, "plataformas").setScale(1).refreshBody();
    // Nueva plataforma derecha
    this.plataformas.create(650, 200, "plataformas").setScale(1).refreshBody();

    this.personaje = this.physics.add.sprite(400, 300, "personaje");
    this.personaje.setScale(0.3);
    this.personaje.setCollideWorldBounds(true);

    this.physics.add.collider(this.personaje, this.plataformas);

    this.cursor = this.input.keyboard.createCursorKeys();
    this.r = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.time.addEvent({
      delay: 1000,
      callback: this.handlerTimer,
      callbackScope: this,
      loop: true,
    });

    this.timerText = this.add.text(10, 10, `Tiempo Restante: ${this.timer}`, {
      fontSize: "32px",
      fill: "#000000",
    });

    this.scoreText = this.add.text(10, 50, `Puntaje: ${this.score} / P: ${this.shapes["pelota"].count} / T: ${this.shapes["taco"].count} / C: ${this.shapes["copa"].count}`);

    this.recolectables = this.physics.add.group({
      bounceY: 1, 
      collideWorldBounds: true, 
    });

    this.physics.add.collider(this.personaje, this.recolectables, this.collectShape, null, this);
    this.physics.add.collider(this.recolectables, this.plataformas, this.onRecolectableBounced, null, this);

    this.time.addEvent({
      delay: 1000,
      callback: this.onSecond,
      callbackScope: this,
      loop: true,
    });
  }

  collectShape(personaje, recolectable) {
    const nombreFig = recolectable.texture.key;
    const puntosFig = this.shapes[nombreFig].points;
    this.score += puntosFig;
    this.shapes[nombreFig].count += 1;
    recolectable.destroy();

    this.scoreText.setText(`Puntaje: ${this.score} / P: ${this.shapes["pelota"].count} / T: ${this.shapes["taco"].count} / C: ${this.shapes["copa"].count}`);

    this.checkWin();
  }

  floor(plataformas, recolectables) {
    recolectables.disableBody(true, true);
  }

  checkWin() {
    const cumplePuntos = this.score >= 100;
    const cumpleFiguras = this.shapes["pelota"].count >= 2 && this.shapes["taco"].count >= 2 && this.shapes["copa"].count >= 2;

    if (cumplePuntos && cumpleFiguras) {
      this.gameOver = true;
      this.scene.start("end", {
        score: this.score,
        gameOver: false,  // Esto indica que el jugador ha ganado
      });
    }
  }

  onSecond() {
    if (this.gameOver) return;

    const tipos = ["pelota", "taco", "copa", "curry"];
    const tipo = Phaser.Math.RND.pick(tipos);
    let recolectable = this.recolectables.create(Phaser.Math.Between(10, 790), 0, tipo).setScale(1).refreshBody();
    recolectable.setVelocity(0, 100);

    if (tipo === "curry") {
      recolectable.setScale(0.6); 
      recolectable.setBounce(Phaser.Math.FloatBetween(0.4, 0.8)); 
      recolectable.setCollideWorldBounds(true); 
    } else {
      recolectable.setScale(0.2); 
    }

    const rebote = Phaser.Math.FloatBetween(0.4, 0.8);
    recolectable.setBounce(rebote);

    recolectable.setData("points", this.shapes[tipo].points);
    recolectable.setData("tipo", tipo);
  }

  
handlerTimer() {
  this.timer -= 1;
  this.timerText.setText(`Tiempo Restante: ${this.timer}`);
  if (this.timer === 0) {
    this.gameOver = true;
    this.scene.start("end", {
      score: this.score,
      gameOver: true,  // Esto indica que el jugador ha perdido
    });
  }
}

  onRecolectableBounced(recolectable, plataforma) {
    console.log("recolectable rebote");
    if (recolectable.texture.key !== "curry") {
      let points = recolectable.getData("points");
      points -= 5;
      recolectable.setData("points", points);
      if (points <= 0) {
        recolectable.destroy();
      }
    }
  }

  update() {
    if (this.cursor.left.isDown) {
      this.personaje.setVelocityX(-160);
    } else if (this.cursor.right.isDown) {
      this.personaje.setVelocityX(160);
    } else {
      this.personaje.setVelocityX(0);
    }

    if (this.cursor.up.isDown && this.personaje.body.touching.down) {
      this.personaje.setVelocityY(-330);
    }

    if (this.r.isDown) {
      this.scene.restart("main");
    }

    if (this.gameOver) {
      this.physics.pause();
      this.timerText.setText("Game Over");
      return;
    }
  }
}
