describe('API', function() {
    var def = require_joo();
    function MyClass() {}

    it('has .it property.', function() {
        expect(typeof def(MyClass).it === 'object').toBe(true);
    });
    it('has .provides() method.', function() {
        expect(def(MyClass).provides instanceof Function).toBe(true);
    });
    it('has .inherits() method.', function() {
        expect(def(MyClass).inherits instanceof Function).toBe(true);
    });
    it('has .borrows() method.', function() {
        expect(def(MyClass).borrows instanceof Function).toBe(true);
    });
    it('has .hasStatic() method.', function() {
        expect(def(MyClass).hasStatic instanceof Function).toBe(true);
    });
    it('has .as() method.', function() {
        expect(def(MyClass).as instanceof Function).toBe(true);
    });
});

describe('.it property', function() {
    var def = require_joo();
    function MyClass() {}

    it('refers to itself.', function() {
        var descriptor = def(MyClass);
        expect(descriptor.it).toBe(descriptor);
    });
});

describe('.provides() method', function() {
    var def = require_joo();
    function MyClass(name) {
        this.name = name;
    }
    def(MyClass).
    it.provides({
        getName: function() {
            return this.name;
        }
    });
    var myObject = new MyClass('Hiroshi');

    it('returns itself.', function() {
        var descriptor = def(MyClass);
        expect(descriptor.provides({})).toBe(descriptor);
    });

    it('provides methods to a Class.', function() {
        expect(myObject instanceof MyClass).toBe(true);
        expect(myObject.getName instanceof Function).toBe(true);
        expect(myObject.getName()).toBe('Hiroshi');
    });

    it('reserves .constructor property pointing to its constructor correctly.', function() {
        // myObject.constructor property points to its constructor correctly.
        expect(myObject.constructor).toBe(MyClass);
    })
});

describe('.inherits() method', function() {
    var def = require_joo();

    // prepare spied methods
    function SpyClass() {}
    def(SpyClass).provides({
        inParentClassConstructor: function() {},
        inParentClassGetNameMethod: function() {},
        inParentClassDecorateMethod: function() {},
        inChildClassConstructor: function() {},
        inChildClassGetAgeMethod: function() {},
        inChildClassDecorateMethod: function() {},
        inGrandChildClassConstructor: function() {}
    });
    var spy = new SpyClass;

    /**
     * ParentClass
     */
    function ParentClass(name) {
        this.name = name;
        spy.inParentClassConstructor(); // spy method
    }

    /**
     * ChildClass
     */
    function ChildClass(name, age) {
        this._super(name);
        this.age = age;
        spy.inChildClassConstructor(); // spy method
    }

    /**
     * GrandChildClass
     */
    function GrandChildClass(name, age) {
        this._super(name, age);
        spy.inGrandChildClassConstructor(); // spy method
    }

    it('returns itself.', function() {
        var descriptor = def(ParentClass);
        expect(descriptor.inherits()).toBe(descriptor);
    });

    describe('this._super() in constructor function', function() {
        beforeEach(function() {
            spyOn(spy, 'inParentClassConstructor');
            spyOn(spy, 'inChildClassConstructor');
            spyOn(spy, 'inGrandChildClassConstructor');
        });

        it('doesn\'t invoke super class\'s constructor at declaration.', function() {
            // ChildClass definition
            expect(spy.inParentClassConstructor).not.toHaveBeenCalled();
            def(ChildClass).inherits(ParentClass);
            expect(spy.inParentClassConstructor).not.toHaveBeenCalled();

            // GrandChildClass definition
            expect(spy.inChildClassConstructor).not.toHaveBeenCalled();
            def(GrandChildClass).inherits(ChildClass);
            expect(spy.inChildClassConstructor).not.toHaveBeenCalled();
        });

        it('appropriately chains constructor invokation up to top of the inheritance at instanciation.', function() {
            expect(spy.inParentClassConstructor).not.toHaveBeenCalled();
            expect(spy.inChildClassConstructor).not.toHaveBeenCalled();
            expect(spy.inGrandChildClassConstructor).not.toHaveBeenCalled();
            var g = new GrandChildClass('Hiroshi', 29);
            expect(spy.inParentClassConstructor).toHaveBeenCalled();
            expect(spy.inChildClassConstructor).toHaveBeenCalled();
            expect(spy.inGrandChildClassConstructor).toHaveBeenCalled();
            expect(g.name).toBe('Hiroshi');
            expect(g.age).toBe(29);
        });
    });

    describe('this._super() in a method', function() {
        beforeEach(function() {
            spyOn(spy, 'inParentClassGetNameMethod');
            spyOn(spy, 'inChildClassGetAgeMethod');
            spyOn(spy, 'inParentClassDecorateMethod');
            spyOn(spy, 'inChildClassDecorateMethod');

            // GrandChildClass < ChildClass < ParentClass
            def(ChildClass).inherits(ParentClass);
            def(GrandChildClass).inherits(ChildClass);

            // ParentClass implements getName
            def(ParentClass).provides({
                getName: function() {
                    spy.inParentClassGetNameMethod(); // spy method
                    return this.name;
                },
                decorate: function() {
                    spy.inParentClassDecorateMethod(); // spy method
                    return 'parent';
                }
            });

            // ChildClass implements getAge
            def(ChildClass).provides({
                getAge: function() {
                    spy.inChildClassGetAgeMethod();
                    return this.age;
                },
                decorate: function() {
                    spy.inChildClassDecorateMethod();
                    return this._super() + ' child';
                }
            });

            // GrandChildClass overrides both getName, getAge, and even toString
            def(GrandChildClass).provides({
                getName: function() {
                    // Even if the closest ancestor (in this case, ChildClass) doesn't implement getName() method explicitly,
                    // this._super() properly looks up to ParentClass's getName() method.
                    // This is awesome, isn't it?
                    return 'My name is ' + this._super();
                },
                getAge: function() {
                    return 'I am ' + this._super();
                },
                decorate: function() {
                    return this._super() + ' grandchild';
                },

                // You can override built-in toString() method in the same way even in IE.
                // I wrote some codes to avoid IE bug.
                toString: function() {
                    return this._super() + ' (name: ' + this.name + ')';
                },
                toLocaleString: function() {
                    return this.toString();
                },
                valueOf: function() {
                    return this.toString();
                },
                isPrototypeOf: function() {
                    return true;
                }
            });
        });

        it('chains method invokation properly up to the highest ancestor which implements it.', function() {
            var g = new GrandChildClass('Hiroshi', 29);

            expect(spy.inParentClassGetNameMethod).not.toHaveBeenCalled();
            expect(g.getName()).toBe('My name is Hiroshi');
            expect(spy.inParentClassGetNameMethod).toHaveBeenCalled();

            expect(spy.inChildClassGetAgeMethod).not.toHaveBeenCalled();
            expect(g.getAge()).toBe('I am 29');
            expect(spy.inChildClassGetAgeMethod).toHaveBeenCalled();

            expect(spy.inParentClassDecorateMethod).not.toHaveBeenCalled();
            expect(spy.inChildClassDecorateMethod).not.toHaveBeenCalled();
            expect(g.decorate()).toBe('parent child grandchild');
            expect(spy.inParentClassDecorateMethod).toHaveBeenCalled();
            expect(spy.inChildClassDecorateMethod).toHaveBeenCalled();
        });

        it('can override toString, toLocaleString, valueOf, isPrototypeOf, even in IE.', function() {
            var g = new GrandChildClass('Hiroshi', 29);
            expect(g.toString()).toBe('[object Object] (name: Hiroshi)');
            expect(g.toLocaleString()).toBe('[object Object] (name: Hiroshi)');
            expect(g.valueOf()).toBe('[object Object] (name: Hiroshi)');
            expect(g.isPrototypeOf(g)).toBe(true);
        });
    });
});

describe('.borrows() method', function() {
    var def = require_joo();
    function MyClass(name, age) {
        this.name = name;
        this.age = age;
    }
    var Provider = {
        methodA: function() {
            return this.name;
        }
    };
    function OtherProvider() {}
    def(OtherProvider).provides({
        methodB: function() {
            return this.age;
        }
    });

    it('returns itself', function() {
        var descripter = def(MyClass);
        expect(descripter.borrows()).toBe(descripter);
    });

    it('imports methods from other object to the subject class.', function() {
        def(MyClass).borrows(Provider);
        expect(MyClass.prototype.methodA).toBe(Provider.methodA);
        expect(new MyClass('Hiroshi', 29).methodA()).toBe('Hiroshi');
    });

    it('imports methods from other class to the subject class.', function() {
        def(MyClass).borrows(OtherProvider);
        expect(MyClass.prototype.methodB).toBe(OtherProvider.prototype.methodB);
        expect(new MyClass('Hiroshi', 29).methodB()).toBe(29);
    });

    it('accepts any number of arguments.', function() {
        var a = {a: function() {}},
            b = {b: function() {}},
            c = {c: function() {}},
            d = {d: function() {}};
        def(MyClass).borrows(a, b, c, d);
        expect(MyClass.prototype.a).toBe(a.a);
        expect(MyClass.prototype.b).toBe(b.b);
        expect(MyClass.prototype.c).toBe(c.c);
        expect(MyClass.prototype.d).toBe(d.d);
    });

    it('doesn\'t affect inheritance structure. It just imports methods.', function() {
        function Class() {}
        function SubClass() {}
        def(SubClass).inherits(Class).
        it.borrows(OtherProvider);
        var myObj = new SubClass;
        expect(myObj instanceof Class).toBe(true);
        expect(myObj instanceof SubClass).toBe(true);
        expect(myObj instanceof OtherProvider).toBe(false);
    });
});

describe('.as() method', function() {
    var def = require_joo();

    it('returns itself.', function() {
        function MyClass() {}
        var descripter = def(MyClass);
        expect(descripter.as('MyClass')).toBe(descripter);
    });

    it('exports defined function to global scope under given namespace.', function() {
        (function() {
            function LocalClass() {}
            def(LocalClass).as('myapp.module.MyClass').
            it.provides({
                hello: function() {
                    return 'hello';
                }
            });

            expect(LocalClass).toBe(myapp.module.MyClass);
            expect(new LocalClass().hello()).toBe('hello');
        })();
        expect(function() {
            new LocalClass();
        }).toThrow();
        expect(new myapp.module.MyClass().hello()).toBe('hello');
    });

    it('uses second argument as a context under which given namespace will be created.', function() {
        (function() {
            var context = {};
            def(function() {}).as('myapp.module.Class', context).
            it.provides({
                hello: function() {
                    return 'hello';
                }
            });
            expect(new context.myapp.module.Class().hello()).toBe('hello');
        })();

        expect(function() {
            new myapp.module.Class().hello();
        }).toThrow();
    });
});

describe('.hasStatic() method', function() {
    var def = require_joo();

    it('returns itself', function() {
        var descriptor = def(function() {});
        expect(descriptor.hasStatic({})).toBe(descriptor);
    });

    it('appends properties as a class property', function() {
        function Class() {}
        def(Class).it.hasStatic({
            FOO: function() {
                return 'static';
            },
            BAR: {
                BAZ: 1
            }
        });
        expect(Class.FOO()).toBe('static');
        expect(Class.BAR.BAZ).toBe(1);
    });

    it('appends static properties, and the properties is visible through this._static property from a method', function() {
        function Class() {}
        def(Class).it.hasStatic({
            FOO: function() {
                return 'FOO';
            },
            BAR: {
                BAZ: 1
            }
        }).it.provides({
            callFoo: function() {
                return this._static.FOO();
            },
            returnBar: function() {
                return this._static.BAR;
            }
        });

        expect(new Class().callFoo()).toBe('FOO');
        expect(new Class().returnBar()).toBe(Class.BAR);
    })
});
