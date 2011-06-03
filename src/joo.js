;(function(global) {
    if (typeof exports != 'undefined' && exports != null) exports = module.exports = define;
    else global.require_joo = function() {
        return define;
    }

    function define(Class) {
        return new ClassDescriptor(Class instanceof Function ? Class : function() {});
    }

    function ClassDescriptor(Class) {
        if (!Class._super) Class._super = Class.prototype._super = Object;
        this.Class = Class;
        this.it = this;
    }

    ClassDescriptor.prototype.as = function(namespace, context) {
        var hierarchy = namespace.split('.'), name = hierarchy.pop();
        createNamespace(hierarchy, context || global)[name] = this.Class;
        return this;
    }

    ClassDescriptor.prototype.inherits = function(SuperClass) {
        if (SuperClass instanceof Function) inherit(this.Class, SuperClass);
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

    function Class() {}
    var hasReferenceToSuper = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
    var ieBugs = {toString:0}.propertyIsEnumerable('toString') ?
                 false : ['toString', 'toLocaleString', 'valueOf', 'isPrototypeOf'];

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
            provide(Class, provider, {'_super':1, 'constructor':1});
        }
    }

    function provide(Class, properties, exception) {
        var i = 0, name, proto = Class.prototype, superProto = Class._super.prototype;
        for (name in properties)
            if (!exception || !(name in exception))
                addProperty(proto, name, properties[name], superProto);

        if (ieBugs) while (name = ieBugs[i++]) if (properties.hasOwnProperty(name))
            addProperty(proto, name, properties[name], superProto);
    }

    function addProperty(proto, name, property, superProto) {
        proto[name] = property instanceof Function
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
