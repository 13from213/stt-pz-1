// functions.test.js
const { 
  sum, pow, factorial, fibonacci, 
  removeByName, makeCounter, 
  getAsyncTimerId, asyncMultiply, httpGet 
} = require('./lib.js');

describe("sum — додавання двох чисел", () => {
  test("правильно додає два числа", () => {
    expect(sum(5, 3)).toBe(8);
    expect(sum(-5, 2)).toBe(-3);
    expect(sum(0, 0)).toBe(0);
  });

  test("працює зі строками, які можна привести до числа", () => {
    expect(sum("10", "20")).toBe(30);
    expect(sum("5", 5)).toBe(10);
    expect(sum("", "15")).toBe(15); // Number('') === 0
  });

  test("повертає NaN при некоректних даних", () => {
    expect(sum("abc", 5)).toBeNaN();
    expect(sum(10, "xyz")).toBeNaN();
  });
});

describe("pow — піднесення до степеня", () => {
  test("підносить до додатного цілого степеня", () => {
    expect(pow(2, 3)).toBe(8);
    expect(pow(5, 2)).toBe(25);
    expect(pow(10, 0)).toBe(1);
  });

  test("має підтримувати від'ємні степені", () => {
    expect(pow(2, -1)).toBe(0.5);
    expect(pow(10, -2)).toBe(0.01);
  });

  test("має підтримувати дробові степені", () => {
    expect(pow(4, 0.5)).toBe(2);
    expect(pow(8, 1/3)).toBeCloseTo(2);
  });

  test("будь-яке число в степені 0 має дорівнювати 1", () => {
    expect(pow(0, 0)).toBe(1);
    expect(pow(-5, 0)).toBe(1);
  });
});

describe("factorial — обчислення факторіалу", () => {
  test("правильно рахує факторіал для невід'ємних чисел", () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(factorial(7)).toBe(5040);
  });

  test("не має падати в безкінечну рекурсію при від'ємних аргументах", () => {
    // зараз падає — тест спеціально покаже помилку
    expect(() => factorial(-1)).toThrow();
  });
});

describe("fibonacci — послідовність Фібоначчі", () => {
  test("повертає правильні значення послідовності Фібоначчі", () => {
    expect(fibonacci(0)).toBe(0);   // зараз повертає 1 → баг
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(2)).toBe(1);
    expect(fibonacci(3)).toBe(2);
    expect(fibonacci(4)).toBe(3);
    expect(fibonacci(5)).toBe(5);
    expect(fibonacci(10)).toBe(55);
  });
});

describe("removeByName — видалення елемента за ім'ям", () => {
  test("видаляє лише перше входження елемента", () => {
    const list = ["Іван", "Олена", "Петро", "Олена"];
    expect(removeByName(list, "Олена")).toEqual(["Іван", "Петро", "Олена"]);
  });

  test("не змінює (не мутає) початковий масив", () => {
    const list = ["a", "b", "c"];
    removeByName(list, "b");
    expect(list).toEqual(["a", "b", "c"]);
  });

  test("повертає нову копію масиву, навіть якщо елемент не знайдено", () => {
    const list = ["x", "y"];
    const result = removeByName(list, "z");
    expect(result).toEqual(["x", "y"]);
    expect(result).not.toBe(list); // має бути нова копія
  });
});

describe("makeCounter — створення лічильника", () => {
  test("створює лічильник з правильним початковим значенням", () => {
    const counter = makeCounter(5);
    expect(counter()).toBe(5);
    expect(counter()).toBe(6);
    expect(counter()).toBe(7);
  });

  test("різні лічильники незалежні один від одного", () => {
    const c1 = makeCounter(10);
    const c2 = makeCounter(100);
    c1();
    expect(c1()).toBe(11);
    expect(c2()).toBe(100);
  });
});

describe("getAsyncTimerId — асинхронний таймер", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => jest.useRealTimers());

  test("має повертати unixtime ПІСЛЯ затримки (зараз повертає undefined)", () => {
    const id = getAsyncTimerId(1000);
    expect(id).toBeUndefined(); // баг

    jest.advanceTimersByTime(1000);
    // після таймауту значення все одно недоступне зовні
  });
});

describe("asyncMultiply — асинхронне множення", () => {
  beforeEach(() => jest.useFakeTimers());

  test("повертає проміс, який через 3 секунди резолвиться у 2*x", async () => {
    const promise = asyncMultiply(7);
    jest.advanceTimersByTime(3000);
    await expect(promise).resolves.toBe(14);
  });

  test("працює з від'ємними числами", async () => {
    const promise = asyncMultiply(-4);
    jest.advanceTimersByTime(3000);
    await expect(promise).resolves.toBe(-8);
  });
});

describe("httpGet — GET-запит через XMLHttpRequest", () => {
  let mockXhr;

  beforeEach(() => {
    mockXhr = {
      open: jest.fn(),
      send: jest.fn(),
      onload: null,
      onerror: null,
      status: 200,
      statusText: "OK",
      response: "тестова відповідь",
      readyState: 4,
      setRequestHeader: jest.fn(),
    };
    global.XMLHttpRequest = jest.fn(() => mockXhr);
  });

  afterEach(() => delete global.XMLHttpRequest);

  test("резолвить проміс при статусі 200", async () => {
    const promise = httpGet("https://example.com");
    mockXhr.onload();
    await expect(promise).resolves.toBe("тестова відповідь");
  });

  test("реджектить проміс при помилці мережі", async () => {
    const promise = httpGet("https://example.com");
    mockXhr.onerror();
    await expect(promise).rejects.toThrow("Помилка мережі");
  });

  test("реджектить проміс при статусі ≠ 200", async () => {
    mockXhr.status = 404;
    mockXhr.statusText = "Не знайдено";

    const promise = httpGet("https://example.com");
    mockXhr.onload();

    await expect(promise).rejects.toThrow("Не знайдено");
    await expect(promise).rejects.toHaveProperty("code", 404);
  });
});