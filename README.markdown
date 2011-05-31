<a name="README">[JavaScript Simple Class Declaration](http://github.com/kuwabarahiroshi/JavaScript-Simple-Class-Declaration)</a>
=======
This is a simple class declaration function in JavaScript.
Classes defined with this function behave exactly as same as normal JavaScript constructor functions.
This program aims to be as just a syntax sugar to easily declare Classes, its inheritance, Mix-ins, namespace, statics etc. without any dependencies on other libraries nor any conflicts with them.

**Table of contents**

* [The API](#TheAPI)
* [Features](#Features)
  * [Class declaration](#ClassDeclaration)
  * [Inheritance](#Inheritance)
  * [Mix-ins](#Mixins)
  * [Static properties](#StaticProperties)
  * [Export to namespace](#ExportToNamespace)
* [Good Points](#GoodPoints)


## <a name="TheAPI">The API</a>

Here is the whole API of this program.

	var def = use_simple_class_declaration();
	
	def(function() {
	    // This is the class constructor.
	    // You can call SuperClass's constructor as below.
	    this._super();
	}).as('myapp.module.MyClass').
	it.inherits(SuperClass).
	it.borrows(MethodProvider, OtherProvider, AndMore).
	it.hasStatic({
	    STATIC_PROPERTY: [],
	    STATIC_METHOD: function() {}
	}).
	it.provides({
	    method: function() {
	        // invocation of a method of the same name in SuperClass's implementation
	        this._super();
	
	        // below expressions refer the same static object.
	        this._static.STATIC_PROPERTY;
	        this.constructor.STATIC_PROPERTY;
	        myapp.module.MyClass.STATIC_PROPERTY;
	    }
	});

The API provides `.it` as a syntactic ornament which makes class declaration look like natural sentences.
Someone would claim that it causes unnecessary object reference, which influences performance.
But I think it's acceptable cost unless you declare classes thouthands of times.
Nevertheless, if you hate it, you can omit it.

	def(MyClass).inherits(SuperClass).provides({...});

## <a name="Features">Features</a>

Now, let's take a look at each functionalities in detail.

### <a name="ClassDeclaration">ClassDeclaration</a>

First of all, you need to call `use_simple_class_declaration()`, which returns a function.
To use the function, store it in any variable as you like,
such as `def`, `define`, `declare` etc.

	var def = use_simple_class_declaration();
	
	// You can define constructor function in a standard way.
	function BaseClass(name) {
	    this.name = name;
	}
	
	// Then, you can define methods by chaining '.it.provides()' method.
	def(BaseClass).it.provides({
	    getName: function() {
	        return this.name;
	    }
	});

That's it.
You can use the class exactly as same as a standard JavaScript class.

	var base = new BaseClass('base');
	
	base instanceof BaseClass      // true
	base.constructor === BaseClass // true
	base.getName();                // 'base'

### <a name="Inheritance">Inheritance</a>

You can define class inheritance as below:

	function ChildClass(name, age) {
	    // You can call super class' constructor by 'this._super()'.
	    this._super(name);
	    this.age = age;
	}
	def(ChildClass).
	it.inherits(BaseClass).
	it.provides({
	    getAge: function() {
	        return this.age;
	    }
	});

The most exciting thing is that the scope chain of `this._super()` woks perfectly even in multiple level inheritances.
This is difficult to write in a standard way.

	function GrandChildClass(name, age) {
	    this._super(name, age);
	}
	def(GrandChildClass).
	it.inherits(ChildClass).
	it.provides({
	    getName: function() {
	        // Even if the closest ancestor (in this case, ChildClass) doesn't implement getName() method explicitly,
	        // this._super() method looks up to BaseClass's getName() method.
	        // This is awesome, isn't it?
	        return 'My name is ' + this._super();
	    },
	    getAge: function() {
	        return 'I am ' + this._super();
	    },
	    toString: function() {
	        // You can override built-in 'toString()' method in the same way.
	        return this._super() + '(name: ' + this.name + ')'
	    }
	});

This works perfectly as we expect.

	var g = new GrandChildClass('Hiroshi', 29);
	g instanceof BaseClass;            // true
	g instanceof ChildClass;           // true
	g instanceof GrandChildClass;      // true
	g.constructor == GrandChildClass;  // true
	g.getName(); // 'My name is Hiroshi'
	g.getAge();  // 'I am 29'
	g + ''       // '[object Object](name: Hiroshi)'

### <a name="Mixins">Mix-ins</a>

Our class can borrow methods from other classes or objects through `.borrows()` method.

	// Mix-in provider can be an object;
	var MethodProvider = {
	    methodA: function() {}
	};
	// or Classes.
	function OtherProvider() {}
	OtherProvider.prototype.methodB = function() {};
	
	// Our class can borrow methods from these providers.
	function OurClass() {}
	def(OurClass).
	it.borrows(MethodProvider, OtherProvider).
	it.provides({
	    ownMethod: function() {}
	});

Now OurClass has `methodA`, `methodB`, `ownMethod`, but an instance of the class won't be a Mix-in provider's instance.

	var c = new OurClass();
	c instanceof MethodProvider; // false
	c instanceof OtherProvider;  // false
	c.methodA();
	c.methodB();
	c.ownMethod();

### <a name="StaticProperties">Static Properties</a>

Here is an example of static properties.

	function MyClass() {}
	def(MyClass).it.hasStatic({
	    FOO: 0,
	    BAR: 1,
	    BLAH: {
	        BAZ: true
	    }
	}).provides({
	    method: function() {
	        // You can refer to static properties through ._static property in an instance method.
	        this._static.FOO == MyClass.FOO; // true
	    }
	});
	
	MyClass.FOO      // 0
	MyClass.BAR      // 1
	MyClass.BLAH.BAZ // true

### <a name="ExportToNamespace">Export To Namespace</a>

It's good habitat to declare your classes in your module scope, then export it to global scope under your namespace;
To achieve this, use `.as()` method.

	(function() {
	    var def = use_simple_class_declaration();
	
	    function ModuleLocalClass() {}
	    def(ModuleLocalClass).as('myapp.module.foo.bar.Blah').
	    it.provides({/*...*/});
	})();
	
	new ModuleLocalClass() // reference error.
	var blah = new myapp.module.foo.bar.Blah();
	blah.constructor // ModuleLocalClass

If you pass a second argument as a context object to `.as()` method, classes are exported under the context instead of a global scope.

	(function() {
	    var def = use_simple_class_declaration();
	    var context = {};
	    def(function() {}).as('myapp.module.Class', context);
	    new context.myapp.module.Class();
	})();


## <a name="GoodPoints">Good points</a>

Some parts of the code, especially `.this._super()` method implementation was inspired by John Resig's Simple JavaScript Inheritance, but I further improved several points.

In this library, 

* `init` method are not mandatory.

John Resig's implementation and many other libraries which provides original class system often requires us to declare `init` method as a constructor function. It is indeed convensional, but not standard. I wanted a simple syntax to use normal function as a class constructor. This is the main reason I wrote this code.

* you can easily implement Mix-in class with `.borrow()` method.
* `this._super()` method works appropriately both in constructors and in methods, even under multiple level inheritance.
* `.constructor` property correctly points to its constructor.
* declaration sentences look like a natural language, and has explicit semantics.


I hope this simple library would be useful to other developers.

	define(MyClass).as('myapp.module.MyClass').
	it.inherits(SuperClass).
	it.borrows(Provider, OtherProvider).
	it.provides({
	    ownMethod: function() {
	    }
	});


