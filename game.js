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

const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);

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
    Object.defineProperty(this, 'type', {
      value: 'actor'
    });
    Object.defineProperty(this, 'left', {
      value: this.pos.x
    });
    Object.defineProperty(this, 'top', {
      value: this.pos.y
    });
    Object.defineProperty(this, 'right', {
      value: this.pos.x + this.size.y
    });
    Object.defineProperty(this, 'bottom', {
      value: this.pos.y + this.size.x
    });
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

const items = new Map();
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
items.forEach(status);