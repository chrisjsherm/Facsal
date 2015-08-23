ko.extenders.numeric = function (target, precision) {
    // Create a writeable computed observable to intercept writes to our observable.
    var result = ko.computed({
        read: target,  //always return the original observables value
        write: function (newValue) {
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue),
                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

            // Only write if value changed.
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                // If the rounded value is the same but a different value was written, force a notification for the current field.
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });

    // Initialize with current value to make sure it is rounded appropriately.
    result(target());

    // Return the new computed observable.
    return result;
};

ko.extenders.percent = function (target, precision) {
    var result = ko.computed({
        read: function () {
            return (target() * 100).toFixed(precision) + "%";
        },
        write: function (newValue) {
            target(parseFloat(newValue) / 100);
        }
    });
    return result;
};

ko.extenders.currency = function (target, configArray) {
    var precision = configArray[0],
        rawValueObservable = configArray[1] || ko.observable();
    // Create a writeable computed observable to intercept writes to our observable.
    var result = ko.computed({
        // Always return the original observable's value.
        read: target,
        write: function (newValue) {
            newValue = newValue ? newValue : 0;

            var current = target(),
                cleansedValue = parseFloat(newValue.toString().replace(/[^\d.-]/g, '')),
                newValueAsNum = isNaN(cleansedValue) ? 0 : parseFloat(+cleansedValue),
                isNegativeValue = newValueAsNum < 0 ? true : false,
                valueToFormat = parseFloat(newValue.toString().replace(/[^\.\d]/g, '')),
                formattedValue = valueToFormat.formatNumber(precision),
                valueToWrite = isNegativeValue ? '($' + formattedValue + ')' : '$' + formattedValue;

            // Only write if value changed.
            if (valueToWrite !== current) {
                rawValueObservable(newValueAsNum);
                target(valueToWrite);
            }
            //else {
            //    // If the rounded value is the same but a different value was written, force a notification for the current field.
            //    if (newValue !== current) {
            //        target.notifySubscribers(valueToWrite);
            //    }
            //}
        }
    }).extend({ notify: 'always' });

    // Initialize with current value to make sure it is rounded appropriately.
    result(target());

    // Return the new computed observable.
    return result;
};

ko.extenders.computedCurrency = function (target, configArray) {
    var precision = configArray[0],
        
        result = ko.computed({
            read: function () {
                newValue = target(),

                cleansedValue = parseFloat(newValue.toString().replace(/[^\d.-]/g, '')),
                newValueAsNum = isNaN(cleansedValue) ? 0 : parseFloat(+cleansedValue),
                isNegativeValue = newValueAsNum < 0 ? true : false,
                valueToFormat = parseFloat(newValue.toString().replace(/[^\.\d]/g, '')),
                formattedValue = valueToFormat.formatNumber(precision),
                valueToWrite = isNegativeValue ? '($' + formattedValue + ')' : '$' + formattedValue;

                return valueToWrite;
            }
        }).extend({ notify: 'always' });

    return result;
}

// From Stack Overflow post: http://stackoverflow.com/questions/17841067/number-inputs-and-ranges-valueupdate-in-knockoutjs
ko.bindingHandlers.slider = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().sliderOptions || {};
        $(element).slider(options);
        ko.utils.registerEventHandler(element, "slidechange", function (event, ui) {
            var observable = valueAccessor();
            observable(ui.value);
        });
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).slider("destroy");
        });
        ko.utils.registerEventHandler(element, "slide", function (event, ui) {
            var observable = valueAccessor();
            observable(ui.value);
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (isNaN(value)) {
            value = 0;
        }

        $(element).slider("value", value);

    }
};

ko.bindingHandlers.currencySlider = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().sliderOptions || (function () {
                console.log('The [sliderOptions] binding was not found on the element.');
                return {};
            })(),

            currencyObservable = allBindingsAccessor().currencyObservable || (function () {
                console.log('The [currencyObservable] binding was not found on the element.');
                return ko.observable(0);
            })(),
            
            totalObservable = allBindingsAccessor().totalObservable || (function () {
                console.log('The [totalObservable] binding was not found on the element.');
                return ko.observable(0);
            })();

        $(element).slider(options);

        // Triggered on every mouse move during slide.
        ko.utils.registerEventHandler(element, "slide", function (event, ui) {
            currencyObservable(Math.round(totalObservable() * (ui.value * .01)));
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).slider("destroy");
        });
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (isNaN(value)) {
            value = 0;
        }

        $(element).slider("value", value);

    }
}

ko.subscribable.fn.subscribeChanged = function (callback) {
    var oldValue;
    this.subscribe(function (_oldValue) {
        oldValue = _oldValue;
    }, this, 'beforeChange');

    this.subscribe(function (newValue) {
        callback(newValue, oldValue);
    });
};