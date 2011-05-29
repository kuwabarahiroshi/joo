;(function(global) {
    global.use_simple_class_declaration = function() {
        return define;
    }

    function define(Class) {
        return new ClassDescriptor(Class instanceof Function ? Class : function() {});
    }

    function ClassDescriptor(Class) {
        Class._super = Class.prototype._super = Object;
        this.Class = Class;
        this.it = this;
    }

    ClassDescriptor.prototype.as = function(namespace, context) {
        var hierarchy = namespace.split('.'), name = hierarchy.pop();
        createNamespace(hierarchy, context || global)[name] = this.Class;
        return this;
    }

    ClassDescriptor.prototype.inherits = function(SuperClass) {
        inherit(this.Class, SuperClass);
        return this;
    };

    ClassDescriptor.prototype.borrows = function() {
        borrow(this.Class, arguments);
        return this;
    };

    ClassDescriptor.prototype.provides = function(methods) {
        provide(this.Class, methods);
        return this;
    };

    ClassDescriptor.prototype.hasStatic = function(properties) {
        makeStatic(this.Class, properties);
        return this;
    }

    var hasReferenceToSuper = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    function Class() {}

    function createNamespace(hierarchy, context) {
        var name = hierarchy.shift();
        if (name) context = (context[name] = context[name] || {});
        if (hierarchy.length) return createNamespace(hierarchy, context);
        return context;
    }

    function inherit(SubjectClass, SuperClass) {
        var proto = Class;
        proto.prototype = SuperClass.prototype;
        SubjectClass.prototype = new proto;
        SubjectClass.prototype.constructor = SubjectClass;
        SubjectClass._super = SuperClass;
        provide(SubjectClass, {_super: SuperClass});
    }

    function borrow(Class, providers) {
        for (var i = 0, l = providers.length, provider; i < l;) {
            if ((provider = providers[i++]) instanceof Function) provider = provider.prototype;
            provide(Class, provider);
        }
    }

    function provide(Class, properties) {
        var name, property, proto = Class.prototype, superProto = Class._super.prototype;
        for (name in properties)
            proto[name] = (property = properties[name]) instanceof Function
                          && hasReferenceToSuper.test(property) && superProto
                          ? createFunctionPointingToSuper(superProto, name, property)
                          : property;
    }

    function createFunctionPointingToSuper(superScope, name, fn) {
        return function() {
            var ret, tmp = this._super;
            this._super = superScope[name];
            ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
        }
    }

    function makeStatic(cls, properties) {
        var name, p = cls.prototype, s = p._static = p._static || {};
        for (name in properties) cls[name] = s[name] = properties[name];
    }
})(this);
