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
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  act() {}

  // Метод проверяет, пересекается ли текущий объект с переданным объектом
  isIntersect(obj) {
    if (!(obj instanceof Actor)) {
      throw new Error('Переданный объект не передан или не является объектом типа Actor');
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
    return this.status !== null && this.finishDelay < 0;
  }

  /* Определяет, расположен ли какой-то другой движущийся
  объект в переданной позиции, и если да, вернёт этот объект */
  actorAt(obj) {
    if (!(obj instanceof Actor)) {
      throw new Error('Объект не передан или не является объектом типа Actor');
    }

    return this.actors.find(el => el.isIntersect(obj));
  }

  /* Определяет, нет ли препятствия в указанном месте. Также
  этот метод контролирует выход объекта за границы игрового поля.*/
  obstacleAt(pos, size) {
    if (!(pos instanceof Vector)) {
      throw new Error('Переданная позиция не является объектом типа Vector');
    }
    if (!(size instanceof Vector)) {
      throw new Error('Переданный размер не является объектом типа Vector');
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

class LevelParser {
  constructor(dict) {
    this.dict = Object.assign({}, dict);
  }

  // Возвращает конструктор объекта по его символу, используя словарь
  actorFromSymbol(sym) {
    return this.dict[sym];
  }

  // Возвращает строку, соответствующую символу препятствия
  obstacleFromSymbol(sym) {
    if (sym === 'x') {
      return 'wall';
    }
    if (sym === '!') {
      return 'lava';
    }
  }

  /* Принимает массив строк и преобразует его в массив массивов,
  в ячейках которого хранится либо строка, соответствующая препятствию,
  либо undefined */
  createGrid(plan) {
    return plan.map(el => el.split('').map(el => this.obstacleFromSymbol(el)));
  }

  /* Принимает массив строк и преобразует его в массив
  движущихся объектов, используя для их создания классы из словаря */
  createActors(actors) {
    return actors.reduce((memo, el, y) => {
      el.split('').forEach((item, x) => {
        let constructor = this.actorFromSymbol(item);
        if (typeof constructor === 'function') {
          let obj = new constructor(new Vector(x, y));
          if (obj instanceof Actor) {
            memo.push(obj);
            return memo;
          }
        }
      });
      return memo;
    }, []);
  }

  /* Принимает массив строк, создает и возвращает игровое поле,
  заполненное препятствиями и движущимися объектами, полученными
  на основе символов и словаря */
  parse(strings) {
    return new Level(this.createGrid(strings), this.createActors(strings));
  }
}

class Fireball extends Actor {
  constructor(coords = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(coords, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  // Создает и возвращает вектор Vector следующей позиции шаровой молнии
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  // Обрабатывает столкновение молнии с препятствием. Меняет вектор скорости на противоположный
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  // Обновляет состояние движущегося объекта
  act(time, grid) {
    let nextPos = this.getNextPosition(time);
    let obstacle = grid.obstacleAt(nextPos, this.size);
    if (obstacle) {
      this.handleObstacle();
    }
    else {
      this.pos = nextPos;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(coords = new Vector(0, 0)) {
    super(coords, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(coords = new Vector(0, 0)) {
    super(coords, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(coords = new Vector(0, 0)) {
    super(coords, new Vector(0, 3));
    this.start = coords;
  }

  // Метод возвращает координаты на начальные
  handleObstacle() {
    this.pos = this.start;
  }
}

class Coin extends Actor {
  constructor(coords = new Vector(0, 0)) {
    super(coords.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.springSpeed = 8; // Скорость подпрыгивания
    this.springDist = 0.07; // Радиус подпрыгивания
    this.spring = Math.random() * (Math.PI * 2); // Фаза подпрыгивания
    this.start = this.pos; // Начальные координаты
  }

  get type() {
    return 'coin';
  }

  // Обновляет фазу подпрыгивания
  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  // Создает и возвращает вектор подпрыгивания
  getSpringVector() {
    let newY = Math.sin(this.spring) * this.springDist;
    return new Vector(0, newY);
  }

  // Обновляет текущую фазу, создает и возвращает вектор новой позиции монетки
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.start.plus(this.getSpringVector());
  }

  // Получает новую позицию объекта и задает её как текущую
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(coords = new Vector(0, 0)) {
    super(coords.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

const schemas = loadLevels();

const actors = {
  '@': Player,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin,
  'v': FireRain
}

const parser = new LevelParser(actors);

schemas.then(result => {
  runGame(JSON.parse(result), parser, DOMDisplay)
  .then(() => alert('Успех! Вы выиграли!'));
});
