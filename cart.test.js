const { CartItem, Cart, round2 } = require("./cart");

describe("CartItem", () => {
  test("should throw an error if SKU is missing or not a string", () => {
    const errorMessage = "SKU is required";

    expect(() => new CartItem(null, "Product", 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem(undefined, "Product", 10, 1)).toThrow(
      errorMessage
    );
    expect(() => new CartItem("", "Product", 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem(123, "Product", 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem({}, "Product", 10, 1)).toThrow(errorMessage);
  });

  test("should throw an error if name is missing or not a string", () => {
    const errorMessage = "Name is required";

    expect(() => new CartItem("SKU1", null, 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", undefined, 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", "", 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", 123, 10, 1)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", {}, 10, 1)).toThrow(errorMessage);
  });

  test("should throw an error if unitPrice is not a number or <= 0", () => {
    const errorMessage = "unitPrice must be > 0";

    expect(() => new CartItem("SKU1", "Product", null, 1)).toThrow(
      errorMessage
    );
    expect(() => new CartItem("SKU1", "Product", "10", 1)).toThrow(
      errorMessage
    );
    expect(() => new CartItem("SKU1", "Product", 0, 1)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", "Product", -5, 1)).toThrow(errorMessage);
  });

  test("should throw an error if qty is not an integer or <= 0", () => {
    const errorMessage = "qty must be positive integer";

    expect(() => new CartItem("SKU1", "Product", 10, 0)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", "Product", 10, -1)).toThrow(errorMessage);
    expect(() => new CartItem("SKU1", "Product", 10, 1.5)).toThrow(
      errorMessage
    );
    expect(() => new CartItem("SKU1", "Product", 10, "1")).toThrow(
      errorMessage
    );
  });

  test("should create CartItem with valid data", () => {
    const item = new CartItem("SKU1", "Product", 10, 2);

    expect(item.sku).toBe("SKU1");
    expect(item.name).toBe("Product");
    expect(item.unitPrice).toBe(10);
    expect(item.qty).toBe(2);
  });

  test("should use qty = 1 by default", () => {
    const item = new CartItem("SKU1", "Product", 10);

    expect(item.qty).toBe(1);
  });

  test("should correctly calculate lineTotal", () => {
    const item = new CartItem("SKU1", "Product", 10, 3);

    expect(item.lineTotal).toBe(30);
  });
});

describe("Cart", () => {
  describe("Creating Cart", () => {
    test("should create Cart with valid data", () => {
      const cart = new Cart();

      expect(cart.items).toEqual([]);
      expect(cart.pricing).toEqual({
        promoCodes: {
          SALE10: 10,
          FREE100: 100,
          SPRING5: 5,
        },
      });
      expect(cart.appliedPromo).toBeNull();
    });

    test("should create Cart with custom pricing", () => {
      const cart = new Cart({
        promoCodes: {
          SALE10: 20,
          FREE100: 200,
          SPRING5: 10,
        },
      });

      expect(cart.pricing).toEqual({
        promoCodes: {
          SALE10: 20,
          FREE100: 200,
          SPRING5: 10,
        },
      });
    });

    test("should create Cart with default pricing if pricing is provided but without promoCodes", () => {
      const cart = new Cart({ value: 100 });

      expect(cart.pricing).toEqual({
        promoCodes: {
          SALE10: 10,
          FREE100: 100,
          SPRING5: 5,
        },
      });
    });
  });

  describe("Adding item", () => {
    test("should add new CartItem to cart", () => {
      const cart = new Cart();
      const item = new CartItem("SKU1", "Product 1", 10, 1);

      cart.addItem(item);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toBe(item);
    });

    test("should merge items with the same SKU", () => {
      const cart = new Cart();
      const item1 = new CartItem("SKU1", "Product 1", 10, 2);
      const item2 = new CartItem("SKU1", "Product 1", 10, 3);

      cart.addItem(item1);
      cart.addItem(item2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].qty).toBe(5);
      expect(cart.items[0].sku).toBe("SKU1");
    });

    test("should add items with different SKUs separately", () => {
      const cart = new Cart();
      const item1 = new CartItem("SKU1", "Product 1", 10, 1);
      const item2 = new CartItem("SKU2", "Product 2", 20, 2);

      cart.addItem(item1);
      cart.addItem(item2);

      expect(cart.items).toHaveLength(2);
    });

    test("should throw an error when adding non-CartItem", () => {
      const errorMessage = "item must be CartItem";
      const cart = new Cart();

      expect(() =>
        cart.addItem({ sku: "SKU1", name: "Product", unitPrice: 10 })
      ).toThrow(errorMessage);
      expect(() => cart.addItem(null)).toThrow(errorMessage);
      expect(() => cart.addItem("test")).toThrow(errorMessage);
    });
  });

  describe("Updating quantity", () => {
    test("should update quantity of an item", () => {
      const cart = new Cart();
      const item = new CartItem("SKU1", "Product 1", 10, 2);

      cart.addItem(item);
      cart.updateQty(item.sku, 5);

      expect(cart.items[0].qty).toBe(5);
    });

    test("should throw an error when updating with invalid values", () => {
      const errorMessage = "newQty must be positive integer";
      const cart = new Cart();
      const item = new CartItem("SKU1", "Product 1", 10, 1);

      cart.addItem(item);

      expect(() => cart.updateQty(item.sku, 0)).toThrow(errorMessage);
      expect(() => cart.updateQty(item.sku, -1)).toThrow(errorMessage);
      expect(() => cart.updateQty(item.sku, 1.5)).toThrow(errorMessage);
      expect(() => cart.updateQty(item.sku, "2")).toThrow(errorMessage);
    });

    test("should throw an error when updating non-existent SKU", () => {
      const cart = new Cart();
      expect(() => cart.updateQty("TEST_SKU", 5)).toThrow("Item not found");
    });
  });

  describe("Removing item", () => {
    test("should remove item from cart", () => {
      const cart = new Cart();
      const item1 = new CartItem("SKU1", "Product 1", 10, 1);
      const item2 = new CartItem("SKU2", "Product 2", 20, 1);

      cart.addItem(item1);
      cart.addItem(item2);
      cart.removeItem(item1.sku);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].sku).toBe(item2.sku);
    });

    test("should throw an error when deleting non-existent SKU", () => {
      const cart = new Cart();

      expect(() => cart.removeItem("TEST_SKU")).toThrow("Item not found");
    });
  });

  describe("getSubtotal()", () => {
    test("should return 0 for empty cart", () => {
      const cart = new Cart();

      expect(cart.getSubtotal()).toBe(0);
    });

    test("should correctly calculate subtotal on multiple items", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 10, 2));
      cart.addItem(new CartItem("SKU2", "Product 2", 20, 3));
      cart.addItem(new CartItem("SKU3", "Product 3", 5, 1));

      expect(cart.getSubtotal()).toBe(85);
    });

    test("should correctly calculate subtotal with decimal prices", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 10.99, 2));
      cart.addItem(new CartItem("SKU2", "Product 2", 5.5, 1));

      expect(cart.getSubtotal()).toBe(27.48);
    });
  });

  describe("Applying promo code", () => {
    test("should apply valid promo code", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 100, 1));
      cart.applyPromo("SALE10");

      expect(cart.appliedPromo).toEqual({ code: "SALE10", percent: 10 });
    });

    test("should normalize promo code to uppercase", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 100, 1));
      cart.applyPromo("sale10");

      expect(cart.appliedPromo.code).toBe("SALE10");
    });

    test("should trim spaces in promo code", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 100, 1));
      cart.applyPromo("  SALE10  ");

      expect(cart.appliedPromo.code).toBe("SALE10");
    });

    test("should throw an error for invalid promo code", () => {
      const cart = new Cart();

      expect(() => cart.applyPromo("TEST_PROMO")).toThrow("Invalid promo code");
    });

    test("should throw an error for empty promo code", () => {
      const errorMessage = "Promo code must be non-empty string";
      const cart = new Cart();

      expect(() => cart.applyPromo("")).toThrow(errorMessage);
      expect(() => cart.applyPromo(null)).toThrow(errorMessage);
      expect(() => cart.applyPromo(undefined)).toThrow(errorMessage);
    });

    test("should throw an error for non-string promo code", () => {
      const cart = new Cart();

      expect(() => cart.applyPromo(123)).toThrow(
        "Promo code must be non-empty string"
      );
    });

    test("should throw an error for promo code <0% or >100%", () => {
      const errorMessage = "Configured promo is out of range 0..100";
      const cart = new Cart({
        promoCodes: {
          MORE100: 150,
          LESS0: -10,
        },
      });

      expect(() => cart.applyPromo("MORE100")).toThrow(errorMessage);
      expect(() => cart.applyPromo("LESS0")).toThrow(errorMessage);
    });
  });

  describe("Calculating total", () => {
    test("should return the correct total", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 10, 1));
      cart.applyPromo("SALE10");

      expect(cart.getTotal()).toBe(9);
    });

    test("should return the correct total with promo code", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 100, 1));
      cart.applyPromo("SALE10");

      expect(cart.getTotal()).toBe(90);
    });

    test("should return 0 when applying FREE100 promo code", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 100, 1));
      cart.applyPromo("FREE100");

      expect(cart.getTotal()).toBe(0);
    });

    test("should return 0 when applying FREE100 promo code and the result is negative", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 50, 1));
      cart.applyPromo("FREE100");

      expect(cart.getTotal()).toBe(0);
    });

    test("should round total to 2 decimal places", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 10.333, 1));

      expect(cart.getTotal()).toBe(10.33);
    });

    test("should correctly round total with promo code", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 100, 1));
      cart.applyPromo("SPRING5");

      expect(cart.getTotal()).toBe(95);
    });

    test("should correctly round complex cases", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 33.333, 1));
      cart.applyPromo("SALE10");

      expect(cart.getTotal()).toBe(30);
    });

    test("should correctly round up", () => {
      const cart = new Cart();
      cart.addItem(new CartItem("SKU1", "Product 1", 10.995, 1));

      expect(cart.getTotal()).toBe(11);
    });
  });

  describe("Integrational tests", () => {
    test("should correctly work with full cycle of operations", () => {
      const cart = new Cart();

      cart.addItem(new CartItem("SKU1", "Product 1", 10, 2));
      cart.addItem(new CartItem("SKU2", "Product 2", 20, 1));
      expect(cart.getSubtotal()).toBe(40);

      cart.updateQty("SKU1", 3);
      expect(cart.getSubtotal()).toBe(50);

      cart.removeItem("SKU2");
      expect(cart.getSubtotal()).toBe(30);

      cart.applyPromo("SALE10");
      expect(cart.getTotal()).toBe(27);
    });
  });
});

describe("round2", () => {
  test("should round to 2 decimal places", () => {
    expect(round2(10.333)).toBe(10.33);
    expect(round2(10.336)).toBe(10.34);
    expect(round2(10.995)).toBe(11);
    expect(round2(10.994)).toBe(10.99);
    expect(round2(10)).toBe(10);
    expect(round2(10.1)).toBe(10.1);
  });
});
