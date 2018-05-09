'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /* Создание нового вектора, координаты которого будут
  суммой соответствующих координат суммируемых векторов */
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }

    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  /* Создает и возвращает новый объект типа Vector,
  координаты которого будут равны соответствующим координатам исходного вектора,
  умноженным на множитель */
  times(num) {
    return new Vector(this.x * num, this.y * num);
  }
}

// Пример кода для дебага класса Vector
/*const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);*/

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector)) {
      throw new Error('Позиция не является объектом типа Vector');
    }
    if (!(size instanceof Vector)) {
      throw new Error('Размер не является объектом типа Vector');
    }
    if (!(speed instanceof Vector)) {
      throw new Error('Скорость не является объектом типа Vector');
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
    this.act = function() {};
  }

  get type() {
    return 'actor';
  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.y;
  }

  get bottom() {
    return this.pos.y + this.size.x;
  }

  // Метод проверяет, пересекается ли текущий объект с переданным объектом
  isIntersect(obj) {
    if (!(obj instanceof Actor)) {
      throw new Error('Переданный объект не является объектом типа Actor');
    }
    if (obj === undefined) {
      throw new Error('Не передан объект типа Actor');
    }

    // Пересечение с самим собой всегда возвращает false
    if (obj === this) {
      return false;
    }
    // Объект с отрицательными размерами всегда возвращает false
    if (obj.size.x < 0 || obj.size.y < 0) {
      return false;
    }
    return !(obj.left >= this.right || obj.right <= this.left || obj.top >= this.bottom || obj.bottom <= this.top);
  }
}

// Пример кода для дебага класса Actor
/*const items = new Map();
const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
  return ['left', 'top', 'right', 'bottom']
    .map(side => `${side}: ${item[side]}`)
    .join(', ');  
}

function movePlayer(x, y) {
  player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
  console.log(`${title}: ${position(item)}`);
  if (player.isIntersect(item)) {
    console.log(`Игрок подобрал ${title}`);
  }
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status);*/

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(el => el.type === 'player');
    this.height = grid.length;
    this.width = grid.length !== 0 ? Math.max(...(this.grid.map(el => el.length))) : 0;
    this.status = null;
    this.finishDelay = 1;
  }

  // Определяет, завершен ли уровень
  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    }
    return false;
  }

  /* Определяет, расположен ли какой-то другой движущийся
  объект в переданной позиции, и если да, вернёт этот объект */
  actorAt(obj) {
    if (obj === undefined) {
      throw new new Error('Объект не передан');
    }
    if (!(obj instanceof Actor)) {
      throw new new Error('Объект не является объектом типа Actor');
    }

    return this.actors.find(el => el.isIntersect(obj));
  }

  /* Определяет, нет ли препятствия в указанном месте. Также
  этот метод контролирует выход объекта за границы игрового поля.*/
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector)) {
      throw  new new Error('Переданная позиция не является объектом типа Vector');
    }
    if (!(size instanceof Vector)) {
      throw  new new Error('Переданный размер не является объектом типа Vector');
    }

    let left = Math.floor(pos.x);
    let right = Math.ceil(pos.x + size.x);
    let top = Math.floor(pos.y);
    let bottom = Math.ceil(pos.y + size.y);

    if (left < 0 || right > this.width || top < 0) {
      return 'wall';
    }
    if (bottom > this.height) {
      return 'lava';
    }

    for (let x = left; x < right; x++) {
      for (let y = top; y < bottom; y++) {
        let cell = this.grid[y][x];
        if (cell) {
          return cell;
        }
      }
    }
  }

  // Метод удаляет переданный объект с игрового поля
  removeActor(obj) {
    this.actors = this.actors.filter(el => el !== obj);
  }

  // Определяет, остались ли еще объекты переданного типа на игровом поле
  noMoreActors(type) {
    return !this.actors.some(el => el.type === type);
  }

  /* Меняет состояние игрового поля при касании игроком
  каких-либо объектов или препятствий */
  playerTouched(type, obj) {
    if (this.status !== null) {
      return;
    }
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
      return;
    }
    if (type === 'coin') {
      this.removeActor(obj);
      if (this.noMoreActors(type)) {
        this.status = 'won';
        return;
      }
    }
  }
}

const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}