const canvas = document.getElementById("gmCanvas");

let option1Button = document.getElementById("option1");
let option2Button = document.getElementById("option2");
let option3Button = document.getElementById("option3");
let option4Button = document.getElementById("option4");
let option5Button = document.getElementById("option5");
const startButton = document.getElementById("startButton");
const playbutton = document.getElementById("play");

const moneyText = document.getElementById("money");
const livesText = document.getElementById("lives");
const waveText = document.getElementById("waves");

const entryField = document.getElementById("menu-entry-field")

const CELLSPACING = 29;

// Colors
const WHITE = "rgb(255, 255, 255)";
const LIGHTBLUE = "rgb(10, 255, 255)";
const BLUE = "rgb(100, 100, 255)";
const PURPLE = "rgb(180, 50, 180)";
const LIGHTGREEN = "rgb(10, 255, 100)";
const DARKGREEN = "rgb(0, 100, 0)";
const DARKORANGE = "rgb(255, 80, 10)";
const LIGHTORANGE = "rgb(255, 180, 0)";

const dpi = window.devicePixelRatio;
console.log(dpi);
const ctx = canvas.getContext("2d");
ctx.scale(dpi, dpi);


buyTowerMenu = '<div class="center-text"> \
			<button class="option" id="option1"><p><strong>Gwun</strong> 50 <span class="green">Shuka Juka</span></p></button> \
			<button class="option" id="option2"><p><strong>Ghu</strong> 75 <span class="green">Shuka Juka</span></p></button> \
			<button class="option" id="option3"><p><strong>Gwa</strong> 125 <span class="green">Shuka Juka</span></p></button> \
			<button class="option" id="option4"><p><strong>Shkwee</strong> 250 <span class="green">Shuka Juka</span></p></button> \
			<button class="option" id="option5"><p><strong>Shma</strong> 500 <span class="green">Shuka Juka</span></p></button> \
		</div>'

function setButtons() {
	option1Button = document.getElementById("option1");
	option2Button = document.getElementById("option2");
	option3Button = document.getElementById("option3");
	option4Button = document.getElementById("option4");
	option5Button = document.getElementById("option5");
	option1Button.onclick = function () {
	GameManager.buyTower(1, 50);
	}

	option2Button.onclick = function () {
		GameManager.buyTower(2, 75);
	}

	option3Button.onclick = function () {
		GameManager.buyTower(3, 125);
	}

	option4Button.onclick = function () {
		GameManager.buyTower(4, 250);
	}

	option5Button.onclick = function () {
		GameManager.buyTower(5, 500);
	}

	startButton.onclick = function () {
		console.log("startbutton click");
		GameManager.startWave();
	}
}
/*
Constants
===================================================================================================================================================
===================================================================================================================================================
*/



/*
===================================================================================================================================================
===================================================================================================================================================
Class Definitions
*/

/* -----------------------------------------------------------------------------------------------------------------
Game Manager Class
*/

class GM {
	constructor() {
		this.selected = null;
		this.money = 1000;
		this.lives = 100;
		
		this.waveNumber = 0;
		this.waveActive = false;
		this.enemySpawnQueue = [];

		this.grid = new Grid(canvas.height, canvas.width);
		this.activeEnemies = [];
		this.towers = [];
		this.projectiles = [];

		this.spendMoney(0);
	}

	spendMoney(spent) {
		this.money = this.money - spent;
		moneyText.innerHTML = "Shuka Juka: $" + this.money.toFixed(0);
	}

	update() {

		// Iterate through projectiles and update them
		for (let k = 0; k < this.projectiles.length; k++) {
			let proj = this.projectiles[k];
			proj.update();
			if (proj.position.x < 0 || proj.position.x > canvas.width || proj.position.y < 0 || proj.position.y > canvas.height) {
				this.projectiles.splice(k, 1);
			}

			if (proj.position.distance(proj.target.position) < ((2 * proj._radius) + proj.target._radius)) {
				this.projectiles.splice(k, 1);
				proj.target.damage(proj.damage);
			}
		}

		// Iterate through enemies and update them
		for (let j = 0; j < this.activeEnemies.length; j++) {
			this.activeEnemies[j].update();
			if (this.activeEnemies[j].health <= 0) {
				this.spendMoney(-this.activeEnemies[j].value);
				this.activeEnemies.splice(j, 1);
			}
		}

		// Iterate through towers and update them
		for (let i = 0; i < this.towers.length; i++) {
			this.towers[i].update(this.activeEnemies, this.createProjectile.bind(this));
		}

		// Check if current wave is still active
		if (this.enemySpawnQueue.length == 0 && this.activeEnemies.length == 0) {
			this.waveActive = false;
		}

		return;
	}

	render(ctx) {

		// Reset canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw grid/cells
		this.grid.draw(ctx);

		// If there is a selected cell => change its color to red
		if (this.selected != null) {
			this.grid.cells[this.selected[0]][this.selected[1]].focus(ctx);
		}

		// Iterate through each of the towers and render them
		for (let i = 0; i < this.towers.length; i++) {
			this.towers[i].draw(ctx);
		}

		// Iterate through each of the enemies and render them
		for (let j = 0; j < this.activeEnemies.length; j++) {
			this.activeEnemies[j].draw(ctx);
		}

		// Iterate through each of the projectiles and render them
		for (let k = 0; k < this.projectiles.length; k++) {
			this.projectiles[k].draw(ctx);
		}
		return;
	}

	_spawnEnemy(obj) {
		if (obj.enemySpawnQueue.length > 0) {
			obj.activeEnemies.push(obj.enemySpawnQueue.shift());
		} else {
			return;
		}
		setTimeout(obj._spawnEnemy.bind(null, obj), 500);
	}

	startWave() {
		if (!this.waveActive) {
			this.waveNumber += 1;
			for (let i = 0; i < 1; i++) {
				let newE = new Enemy(this.waveNumber)
				this.enemySpawnQueue.push(newE);
			}

			waveText.innerHTML = "<em>Wave: " + this.waveNumber.toFixed(0) + "</em>";
			this.waveActive = true;

			setTimeout(this._spawnEnemy.bind(null, this), 500);
		}
	}

	createProjectile(position, velocity, target, damage) {
		let newProj = new Projectile(position, velocity, target, damage);
		this.projectiles.push(newProj);
	}

	addTower(cell, type) {
		let position = new Vector2(cell.centerx, cell.centery)
		//let newTower = new Tower(position, WHITE);
		let newTower;
		switch (type) {
			case 2:
				newTower = new Type2Tower(position, WHITE);
				break;
			case 3:
				newTower = new Type3Tower(position, WHITE);
				break;
			case 4:
				newTower = new Type4Tower(position, WHITE);
				break;
			case 5:
				newTower = new Type5Tower(position, WHITE);
				break;
			default:
				newTower = new Type1Tower(position, WHITE);
				break;
		}
		this.towers.push(newTower);
		cell.occupied = true;
		cell.selected = false;
		cell.tower = newTower;
	}

	buyTower(type, cost) {
		if (this.selected != null) {
			let coords = this.selected;
			let cell = this.grid.cells[coords[0]][coords[1]];

			if (!cell.occupied & this.money >= cost) {
				this.addTower(cell, type);
				this.selected = null;
				entryField.innerHTML = "";
				this.spendMoney(cost);
			}
		}
	}

	selectTower() {
		if (this.selected != null) {
			let coords = this.selected;
			let cell = this.grid.cells[coords[0]][coords[1]];

			let tStats = cell.tower.stats;

			let content = ` <div class="center-text">
								<span>Damage: ${tStats.damage}</span>
						    	<span>Shot Speed: ${Math.floor(1000 / tStats.shotDelay)}</span>
						    	<span>Range: ${10 * tStats.range / CELLSPACING}</span>
						    </div>
						  `;
			entryField.innerHTML = content;
		}
	}
}
/* -----------------------------------------------------------------------------------------------------------------
*/


/* -----------------------------------------------------------------------------------------------------------------
Vector2 Class
*/

class Vector2 {
	constructor(x, y) {
		this._x = x;
		this._y = y;
	}

	get x() {
		return this._x;
	}

	set x(value) {
		this._x = value;
	}

	get y() {
		return this._y;
	}

	set y(value) {
		this._y = value;
	}

	get magnitude() {
		return Math.sqrt((this._x ** 2) + (this._y ** 2));
	}

	sub(other) {
		return new Vector2(this._x - other.x, this._y - other.y);
	}

	distance(other) {
		let dist = new Vector2(this._x - other.x, this._y - other.y);
		return dist.magnitude;
	}

	normalize() {
		let mag = this.magnitude;
		this._x = this._x / mag;
		this._y = this._y / mag;
	}
}
/* -----------------------------------------------------------------------------------------------------------------
*/


/* -----------------------------------------------------------------------------------------------------------------
Cell Class
*/

class Cell {
	constructor(color, x, y, size) {
		this.color = color;
		this.left = x;
		this.top = y;
		this.centerx = this.left + (size / 2);
		this.centery = this.top + (size / 2);
		this.bottom = this.top + size;
		this.right = this.left + size;
		this.isPath = false;
		this.selected = false;
		this.occupied = false;
		this.tower = null;
	}

	draw(ctx) {
		ctx.fillStyle = this.selected ? "red" : this.color;
		ctx.fillRect(this.left, this.top, CELLSPACING - 1, CELLSPACING - 1);
	}

	focus(ctx) {
		//ctx.fillStyle = "rgba(0, 0, 255, 50)";
		if (this.occupied) {
			ctx.beginPath();
			ctx.arc(this.centerx, this.centery, this.tower.range, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.closePath();
		}
	}
}
/* -----------------------------------------------------------------------------------------------------------------
*/


/* -----------------------------------------------------------------------------------------------------------------
Grid Class
*/

class Grid {
	constructor(height, width) {
		this.height = height;
		this.width = width;
		this.rows = Math.floor(height / CELLSPACING);
		this.cols = Math.floor(width / CELLSPACING);
		this.path = [[2, 0], [2, 4],  [0, 4],  [0, 7],  [6, 7], [6, 2],
		   [11,2], [11,10], [9, 10], [9, 8],  [7, 8], [7, 12],
		   [3,12], [3, 15], [12,15], [12,24], [8,24], [8,19],
		   [1,19], [1, 23], [3, 23], [3, 26]];

		// Create and populate cells
		this.cells = [];

		for (let i = 0; i < this.rows; i++) {
			let curRow = [];
			for (let j = 0; j < this.cols; j++) {
				let newCell = new Cell("green", j*CELLSPACING, i*CELLSPACING, CELLSPACING - 1);
				curRow.push(newCell);
			}
			this.cells.push(curRow);
		}

		// Initialize path cells (does not reach last cell)
		for (let i = 0; i < this.path.length - 1; i++) {
			let cell1 = this.path[i];
			let cell2 = this.path[i+1];

			let startRow = cell1[0];
			let endRow = cell2[0];

			let startCol = cell1[1];
			let endCol = cell2[1];

			// Every cell in between [startRow, startCol] and [endRow, endCol] are path cells
			let rowDiff = Math.sign(endRow - startRow);
			let colDiff = Math.sign(endCol - startCol);

			if (rowDiff === 0) {
				for (let j = startCol; j != endCol & j < this.cols; j = j + colDiff) {
					this.cells[startRow][j].color = "yellow";
					this.cells[startRow][j].isPath = true;
				}
			} else {
				for (let j = startRow; j != endRow & j < this.rows; j = j + rowDiff) {
					this.cells[j][startCol].color = "yellow";
					this.cells[j][startCol].isPath = true;
				}
			}
		}

		// Initialize last cell in path
		let lastCell = this.path[this.path.length - 1];
		this.cells[lastCell[0]][lastCell[1]].color = "yellow";
		this.cells[lastCell[0]][lastCell[1]].isPath = true;
		return;
	}

	draw (ctx) {
		ctx.moveTo(0, 0);
		ctx.lineWidth = 1;

		for (let i = 0; i < this.rows; i++) {
			for (let j = 0; j < this.cols; j++) {
				let curCell = this.cells[i][j];
				curCell.draw(ctx);
			}
		}
		return;	
	}

	cellToPos (row, col) {
		let x = this.cells[row][col].centerx;
		let y = this.cells[row][col].centery;
		let v = new Vector2(x,y);
		return v;
	}
}

const grid = new Grid(canvas.height, canvas.width);

function drawGrid() {
	console.log(grid.cells);
	console.log(grid.path);
	grid.draw();
	return;
}
/* -----------------------------------------------------------------------------------------------------------------
*/


/* -----------------------------------------------------------------------------------------------------------------
Enemy Class
*/

class Enemy {
	constructor(num) {
		this.velocity = new Vector2(0, 0);
		this.targetPosition = new Vector2(0, 0);
		this.targetIndex = 0;
		this.color = "red";
		this.speed = 3;
		this._radius = ((CELLSPACING - 1) / 2) - Math.floor((1/4) * CELLSPACING);
		this.health;
		this.value = 100;


		let startCell = grid.path[this.targetIndex];
		let startPos = grid.cellToPos(startCell[0], startCell[1]);
		this.position = new Vector2(startPos.x, startPos.y);

		this.setTarget();
		this.getStatsFromWave(num);
	}

	getStatsFromWave(waveNum) {
		this.health = 10 * (waveNum ** 1.7) + 90
		return;
	}

	setTarget() {
		let startCell = grid.path[this.targetIndex];
		let startPos = grid.cellToPos(startCell[0], startCell[1]);

		this.targetIndex++;

		let targetCell = grid.path[this.targetIndex];
		let targetPos = grid.cellToPos(targetCell[0], targetCell[1]);
		this.targetPosition = targetPos;

		this.velocity.x = Math.sign(targetPos.x - startPos.x) * this.speed;
		this.velocity.y = Math.sign(targetPos.y - startPos.y) * this.speed;
		return;
	}

	update() {
		let compareX = this.velocity.x > 0 ? function (x1, x2) { return x1 >= x2; } : function (x1, x2) { return x1 <= x2; };
		let compareY = this.velocity.y > 0 ? function (y1, y2) { return y1 >= y2; } : function (y1, y2) { return y1 <= y2; };
		if  (compareX(this.position.x, this.targetPosition.x) & compareY(this.position.y, this.targetPosition.y)) {
			if (this.targetIndex >= grid.path.length - 1) {
				this.targetIndex = 0;
				let startCell = grid.path[this.targetIndex];
				let startPos = grid.cellToPos(startCell[0], startCell[1]);
				this.position.x = startPos.x;
				this.position.y = startPos.y;
				this.setTarget();
			} else {
				this.position.x = this.targetPosition.x;
				this.position.y = this.targetPosition.y;
				this.setTarget();	
			}
		} else {
			//move
			this.position.x += this.velocity.x;
			this.position.y += this.velocity.y;
		}
		return;
	}

	damage(amount) {
		this.health -= amount;
		return this.health;
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.fillStyle = "red";
		ctx.arc(this.position.x, this.position.y, this._radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
		//this.update();
		return;
	}
}
/* -----------------------------------------------------------------------------------------------------------------
*/



class TowerStats {
	constructor(shotDelay, range, damage) {
		this.shotDelay = shotDelay;
		this.range = range;
		this.damage = damage;
	}
}


/* -----------------------------------------------------------------------------------------------------------------
Tower Class
*/

class TowerBase {
	constructor(position, color, size, shotDelay, range, damage) {
		this.position = position;
		this.color = color;
		this.rotation = 0;
		this.size = size;
		this._radius = ((CELLSPACING - 1) / 2) - Math.floor((1/this.size) * CELLSPACING);

		this.stats = new TowerStats(shotDelay, CELLSPACING * range, damage);

		this.counter = shotDelay;
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.fillStyle = this.color;
		ctx.arc(0, 0, this._radius, 0, Math.PI);
		ctx.fillRect(-this._radius / 3, -this._radius / 2, 2 * this._radius / 3, this._radius);
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-this.rotation * Math.PI / 180);
		ctx.translate(-1 * this.position.x, -1 * this.position.y);
		return;
	}

	_getTarget(enemyList) {
		if (enemyList.length > 0) {
			let closestEnemy = enemyList[0];
			let minDist = this.position.distance(closestEnemy.position);
			for (let i = 1; i < enemyList.length; i++) {
				let curEnemy = enemyList[i];
				let distance = this.position.distance(curEnemy.position);
				if (distance < minDist) {
					closestEnemy = curEnemy;
					minDist = distance;
				}
			}
			return closestEnemy;
		} else {
			return null;
		}	
	}

	update(enemyList, shootCallback) {
		this.counter++;
		let target = this._getTarget(enemyList);
		if (target != null) {
			if (this.position.distance(target.position) <= this.stats.range) {
				this.lookAt(target.position);
				if (this.counter >= this.stats.shotDelay) {
					let x = target.position.x - this.position.x + (target.velocity.x * 2);
					let y = target.position.y - this.position.y + (target.velocity.y * 2);
					let direction = new Vector2(x, y);
					direction.normalize();
					let position = new Vector2(this.position.x, this.position.y);
					position.x = position.x + (direction.x * (this._radius / 3));
					position.y = position.y + (direction.y * (this._radius / 2));
					shootCallback(position, direction, target, this.stats.damage);
					this.counter = 0;
				}
			}
		} else {
			return;
		}
	}

	lookAt(target) {
		let x = target.x - this.position.x;
		let y = this.position.y - target.y;
		this.rotation = (180 * Math.atan(x / y)) / Math.PI;
		if (y < 0) {
			this.rotation = this.rotation + 180;
		}
		return;
	}
}

class Type1Tower extends TowerBase {
	constructor(position, color, size=4) {
		super(position, color, 4, 30, 3, 25);
	}
}

class Type2Tower extends TowerBase {
	constructor(position, color, size=4) {
		super(position, color, 4, 20, 2, 18);
	}
	draw(ctx) {
		//ctx.beginPath();
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.fillStyle = this.color;
		//ctx.arc(0, 0, this._radius, 0, Math.PI);
		ctx.fillRect(-this._radius, -this._radius / 4, 2 * this._radius, this._radius / 2);
		ctx.fillRect(-this._radius / 4, -this._radius, this._radius / 2, this._radius / 2);
		//ctx.fill();
		//ctx.closePath();
		ctx.rotate(-this.rotation * Math.PI / 180);
		ctx.translate(-1 * this.position.x, -1 * this.position.y);
		return;
	}
}

class Type3Tower extends TowerBase {
	constructor(position, color, size=4) {
		super(position, color, 4, 40, 5, 35);
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.fillStyle = this.color;
		//ctx.arc(0, 0, this._radius, 0, Math.PI);
		ctx.moveTo(-this._radius, 0);
		ctx.lineTo(this._radius, 0);
		ctx.lineTo(0, -this._radius);
		ctx.lineTo(-this._radius, 0)
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-this.rotation * Math.PI / 180);
		ctx.translate(-1 * this.position.x, -1 * this.position.y);
		return;
	}
}

class Type4Tower extends TowerBase {
	constructor(position, color, size=4) {
		super(position, color, 4, 40, 4, 50);
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.fillStyle = DARKGREEN;
		//ctx.arc(0, 0, this._radius, 0, Math.PI);
		ctx.fillRect(-this._radius * (4/3), -this._radius, this._radius * (8/3), this._radius * 2);
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(-(((CELLSPACING - 1) / 2) - 2), -this._radius, this._radius * (1/2), this._radius * 2);
		ctx.fillRect((((CELLSPACING - 1) / 2) - 2), -this._radius, -this._radius * (1/2), this._radius * 2);
		ctx.fillRect(-this._radius / 3, -(((CELLSPACING - 1) / 2) - 2), 2 * this._radius / 3, (((CELLSPACING - 1) / 2) - 2));
		ctx.fill();
		ctx.closePath();
		ctx.rotate(-this.rotation * Math.PI / 180);
		ctx.translate(-1 * this.position.x, -1 * this.position.y);
		return;
	}
}


class Type5Tower extends TowerBase {
	constructor(position, color, size=4) {
		super(position, color, 4, 30, 3.5, 150);
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.translate(this.position.x, this.position.y);
		ctx.fillStyle = this.color;
		ctx.rotate(this.rotation * Math.PI / 180);
		
		ctx.fillRect(-((CELLSPACING - 1) / 2) + 4, 0, ((CELLSPACING - 1) / 2) - 6, 2);
		ctx.fillRect(2, 0, ((CELLSPACING - 1) / 2) - 6, 2);

		ctx.fillRect(-2, -((CELLSPACING - 1) / 6), -2, ((CELLSPACING - 1) / 3));
		ctx.fillRect(2, -((CELLSPACING - 1) / 6), 2, ((CELLSPACING - 1) / 3));

		ctx.fill();
		ctx.closePath();
		ctx.rotate(-this.rotation * Math.PI / 180);
		ctx.translate(-1 * this.position.x, -1 * this.position.y);
		return;
	}
}


/* -----------------------------------------------------------------------------------------------------------------
*/


/* -----------------------------------------------------------------------------------------------------------------
Projectile Class
*/

class Projectile {
	constructor(position, velocity, target, damage=20) {
		this.position = position;
		this.velocity = velocity;
		this.target = target;
		this.speed = 16;
		this._radius = ((CELLSPACING - 1) / 2) - Math.floor((1/3) * CELLSPACING);
		this.damage = damage;
	}

	update() {
		this.position.x += (this.velocity.x * this.speed) + this.target.velocity.x;
		this.position.y += (this.velocity.y * this.speed) + this.target.velocity.y;
		return;
	}

	draw(ctx) {
		//console.log(this.position);
		ctx.beginPath();
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.arc(this.position.x, this.position.y, this._radius, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
	}
}

/*
Class Definitions
===================================================================================================================================================
===================================================================================================================================================
*/



/*
===================================================================================================================================================
===================================================================================================================================================
Event Handling
*/


playbutton.addEventListener("click", function () {
	alert("Hello world");
	playbutton.style.display = "none";
	document.getElementById("menu").style.visibility = "visible";

	setTimeout(gameloop, 1000);
});

canvas.onclick = function (event) {
	//console.log((event.clientX - 8) / 3, (event.clientY - 80) / 3);
	console.log(event.clientX, event.clientY, canvas.width, canvas.height);
	//let x = (300 / 800) * (event.clientX - 8);
	//let y = (150 / 480) * (event.clientY - 80);
	let x = (canvas.width / canvas.clientWidth) * (event.clientX - 9);
	let y = (canvas.height / canvas.clientHeight) * (event.clientY - 80);

	let cells = GameManager.grid.cells;

	// Iterate through the cells
	for (let i = 0; i < cells.length; i++) {
		for (let j = 0; j < cells[0].length; j++) {
			let curCell = cells[i][j];

			// If current cell was clicked on
			if (curCell.left <= x & curCell.right >= x & curCell.top <= y & curCell.bottom >= y) {
				
				// Cannot select a path cell
				if (!curCell.isPath) {
						curCell.selected = !curCell.selected; // Toggle selected value for current cell
					
					// If current cell.selected is true (selecting a previously unselected cell)
					if (curCell.selected) {
						GameManager.selected = [i,j];
						if (!curCell.occupied) { // Selecting an empty cell
							entryField.innerHTML = buyTowerMenu;
							setButtons();
						} else { // Selecting a tower
							GameManager.selectTower();
						} 
					
					// Deselecting a previously selected cell
					} else {
						GameManager.selected = null;
						entryField.innerHTML = "";
					}
				
				// Clicked on path cell
				} else {
					GameManager.selected = null;
					entryField.innerHTML = "";
				}
				
			// If current cell was not clicked on: set selected to false
			} else {
				// This ensures that all cells that were not clicked on cannot be selected
				curCell.selected = false;
			}
		}
	}
}
/*
Event Handling
===================================================================================================================================================
===================================================================================================================================================
*/



/*
===================================================================================================================================================
===================================================================================================================================================
Game Loop
*/

const GameManager = new GM();

function gameloop () {
	setTimeout(function() {
		// process inputs
		GameManager.update();
		// render
		GameManager.render(ctx);

		requestAnimationFrame(gameloop);
	}, 1);
}
