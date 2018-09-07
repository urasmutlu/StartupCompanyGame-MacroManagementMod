let _modPath;

// TODO: (Maybe in later versions) Manager counts and feature sharing

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

exports.initialize = (modPath) => {
    _modPath = modPath;

    // Add Macro-Management Mod.
    Modding.setMenuItem({
        name: 'mmmod',
        tooltip: "Macro-Management Mod",
        tooltipPosition: 'top',
        faIcon: 'fa fa-cubes',
        badgeCount: 0,
    });

    // Define custom views
    exports.views = [
        {
            name: 'mmmod',
            viewPath: _modPath + 'view.html',
            controller: function ($rootScope, $scope) {

                // PRODUCT TABS

                this.getCompanyProducts = function(){
                    return $rootScope.settings.products
                };

                this.productList = this.getCompanyProducts();
                this.tab = this.productList[0].name;

                if($rootScope.settings.hasOwnProperty("MacroManagementMod")) {
                    this.featureList = $rootScope.settings.MacroManagementMod["featureList"];
                }

                this.getFeatureInstances = function(){
                    return $rootScope.settings.featureInstances
                };

                this.getFeaturesByProductName = function(productName){
                    var products = this.getCompanyProducts();
                    var product = null;

                    for(var i = 0; i < products.length; i++){
                        if(products[i].name === productName){
                            product = products[i];
                            break;
                        }
                    }

                    var allFeatures = this.getFeatureInstances();
                    var features = [];

                    for(i = 0; i < allFeatures.length; i++){
                        if(allFeatures[i].productId === product.id && !allFeatures[i].featureName.includes("Ads") &&
                            !allFeatures[i].featureName.includes("scription")){
                            features.push(allFeatures[i]);
                        }
                    }

                    return features;
                };

                this.createFeatureList = function(){

                    for(var i = 0; i < this.productList.length; i++){
                        this.featureList[this.productList[i].name] = this.getFeaturesByProductName(this.productList[i].name);

                        for(var j = 0; j < this.featureList[this.productList[i].name].length; j++){
                            this.featureList[this.productList[i].name][j].maxProd = false;
                        }
                    }
                };

                this.updateFeatureList = function(){

                    for(var i = 0; i < this.productList.length; i++){

                        var actualFeatures = this.getFeaturesByProductName(this.productList[i].name);
                        var savedFeatures = this.featureList[this.productList[i].name];

                        var actualFeatureNames = actualFeatures.map(a => a.featureName);
                        var savedFeatureNames = savedFeatures.map(a => a.featureName);

                        let difference1 = actualFeatureNames.filter(x => !savedFeatureNames.includes(x));
                        let difference2 = savedFeatureNames.filter(x => !actualFeatureNames.includes(x));

                        // one or more features are added
                        if(difference1.length > 0){
                            for(var j = 0; j < difference1.length; j++){

                                var newFeature = actualFeatures.find(x => x.featureName === difference1[j]);
                                newFeature.maxProd = false;
                                this.featureList[this.productList[i].name].push(newFeature)
                            }
                        }

                        // one or more features are removed
                        if(difference2.length > 0){
                            for(j = 0; j < difference2.length; j++){

                                var oldFeature = savedFeatures.find(x => x.featureName === difference2[j]);
                                var index = this.featureList[this.productList[i].name].indexOf(oldFeature);
                                this.featureList[this.productList[i].name].splice(index, 1);
                            }
                        }
                    }
                    // update feature list in root scope
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList
                };

                if(this.featureList == null) {
                    this.featureList = {};
                    this.createFeatureList();
                    $rootScope.settings.MacroManagementMod = {};
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList
                }

                this.updateFeatureList();

                this.isMaxProd = function(feature){

                    var features = this.featureList[this.tab];

                    for(var i = 0; i < features.length; i++){

                        if(features[i].featureName === feature.featureName){
                            return this.featureList[this.tab][i].maxProd
                        }

                    }
                    return false;
                };

                this.getRequirementsByModule = function(module){

                    var requirementNames = [];

                    for(var i = 0; i < Components.length; i++) {
                        if(module.requirements.hasOwnProperty(Components[i].name)){
                            requirementNames.push(Components[i].name);

                            if(Components[i].type === "Module"){
                                requirementNames = requirementNames.concat(this.getRequirementsByModule(Components[i]))
                            }
                        }
                    }
                    return requirementNames;
                };


                // COMPONENTS TAB (These codes are mostly taken from Wolf Management Mod)

                if($rootScope.settings.hasOwnProperty("MacroManagementMod")) {
                    if($rootScope.settings.MacroManagementMod.hasOwnProperty("maxProdComponents")){
                        this.maxProdComponents = $rootScope.settings.MacroManagementMod["maxProdComponents"];
                    }
                }

                this.createMaxProdComponentsList = function(){

                    for(var i = 0; i < Components.length; i++){
                        this.maxProdComponents[Components[i].name] = false;
                    }

                };

                if(this.maxProdComponents == null){
                    this.maxProdComponents = {};
                    this.createMaxProdComponentsList();
                    $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents
                }

                this.isMaxProdComponent = function(componentName){

                    return this.maxProdComponents[componentName];

                };

                //Begin - Codes taken from Wolf Management Mod

                this.totalEmployees = [];

                this.orderLevel = function (sLevel) {
                    switch (sLevel) {
                        case "Beginner":
                            return 0;
                        case "Intermediate":
                            return 1;
                        case "Expert":
                            return 2;
                    }
                };

                this.getEmployeeById = function (id) {
                    var Employees = $rootScope.Helpers.GetAllEmployees();
                    for (var i = 0; i < Employees.length; i++) {
                        var Employee = Employees[i];
                        if (Employee.id === id) {
                            return Employee;
                        }
                    }
                };

                this.getAllEmployees = function () {
                    return $rootScope.Helpers.GetAllEmployees();
                };

                this.getEmployeesByType = function (employeeTypeName) {

                    var Employees = this.getAllEmployees();
                    var temp = [];

                    for (var i = 0; i < Employees.length; i++) {
                        var Employee = Employees[i];
                        if (Employee.employeeTypeName == employeeTypeName) {
                            temp.push(Employee);
                        }
                    }
                    return temp;
                };

                this.componentList = function (type) {
                    var array = [];
                    for (var i = 0; i < Components.length; i++) {

                        var obj = Components[i];
                        obj.inventory = this.componentsInInventory(obj.name);
                        obj.researched = this.employeesComponentInfo(obj.name).researched;
                        obj.working = this.employeesComponentInfo(obj.name).working;
                        obj.totalDevsPossible = this.employeesComponentInfo(obj.name).totalDevsPossible;
                        array.push(obj);
                    }

                    return array;
                };

                this.componentsInInventory = function (component) {

                    if ($rootScope.settings.inventory[component]) {
                        return $rootScope.settings.inventory[component];
                    } else {
                        return 0;
                    }

                };

                this.employeesComponentInfo = function (component) {

                    // create an Array if not already
                    if (!this.totalEmployees[component]) {
                        this.totalEmployees[component] = [];
                    }


                    var obj = {researched: 0, working: 0, totalDevsPossible: 0, possibleResearches: []};

                    var Employees = GetRootScope().Helpers.GetAllEmployees();

                    var requiredPosition;


                    for (var c = 0; c < Components.length; c++) {

                        if (Components[c].name == component) {
                            requiredPosition = Components[c].employeeTypeName;
                        }
                    }

                    // Loop through Employees.
                    for (var i = 0; i < Employees.length; i++) {
                        var isResearched = false;
                        var Employee = Employees[i];

                        if (Employee.employeeTypeName === requiredPosition) {
                            obj.totalDevsPossible++;
                        }

                        // Search through the Employee's components.
                        for (var b = 0; b < Employee.components.length; b++) {
                            if (Employee.employeeTypeName === requiredPosition) {
                                if (Employee.components[b].name === component) {
                                    obj.researched++;
                                    isResearched = true;
                                }
                            }
                        }

                        // Put in array the Employee's that still need to research this.
                        if (isResearched === false && Employee.employeeTypeName === requiredPosition) {
                            if (this.totalEmployees[component].indexOf(Employee.id) < 0) {
                                this.totalEmployees[component].push(Employee.id);
                            }

                        }


                        // Search through the Employee's Task. TODO: Add Module
                        if (Employee.task != null && Employee.task.component != undefined) {
                            if (Employee.task.component.name === component) {
                                obj.working++;
                            }
                        }
                    }

                    obj.possibleResearches = this.totalEmployees;

                    return obj;
                };


                this.getEmployeesByResearchedComponent = function (component) {
                    var array = [];
                    var Employees = $rootScope.Helpers.GetAllEmployees();

                    for (var i = 0; i < Employees.length; i++) {
                        var Employee = Employees[i];

                        for (var a = 0; a < Employee.components.length; a++) {
                            if (Employee.components[a].name == component) {
                                array.push(Employee);
                            }
                        }
                    }

                    return array;
                };

                this.getComponentByName = function (component) {
                    for (var i = 0; i < Components.length; i++) {
                        if (Components[i].name == component) {
                            return Components[i];
                        }
                    }
                };


                this.researchComponent = function (component) {

                    var EmployeesByComponent = this.totalEmployees[component];

                    if (EmployeesByComponent.length > 0) {
                        var Employee = this.getEmployeeById(EmployeesByComponent[0]);

                        var compObj = this.getComponentByName(component);
                        var researchPrice = $rootScope.Helpers.GetResearchPrice(compObj);

                        // Check if Employee has the required level.
                        if (this.orderLevel(Employee.level) >= this.orderLevel(compObj.employeeLevel)) {
                            GetRootScope().settings.balance -= researchPrice;
                            Employee.components.push(compObj);
                            this.totalEmployees[component].splice(0, 1);
                            $rootScope.addNotification(Employee.name + " learned " + component + " for $" + researchPrice, 1);
                        } else {
                            $rootScope.addNotification(Employee.name + " needs to be a " + compObj.employeeLevel + " to research this!", 1);
                        }
                    }
                };

                //End - Codes taken from Wolf Management Mod

                this.maxProduction = function (componentName) {

                    var managers = this.getEmployeesByType("Manager");

                    for (var i = 0; i < managers.length; i++) {

                        var componentList = {};
                        employees = managers[i].employees;

                        for (var j = 0; j < employees.length; j++) {
                            employee = this.getEmployeeById(employees[j]);

                            employeeComponents = employee.components;
                            for (var k = 0; k < employeeComponents.length; k++) {
                                componentList[employeeComponents[k].name] = 0
                            }

                        }

                        if (componentList.hasOwnProperty(componentName)) {
                            managers[i].production[componentName] = 9999;
                            this.maxProdComponents[componentName] = true;
                            $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents
                        }

                    }
                };

                this.minProduction = function (componentName) {

                    var managers = this.getEmployeesByType("Manager");

                    for (var i = 0; i < managers.length; i++) {

                        var componentList = {};
                        employees = managers[i].employees;

                        for (var j = 0; j < employees.length; j++) {
                            employee = this.getEmployeeById(employees[j]);

                            employeeComponents = employee.components;
                            for (var k = 0; k < employeeComponents.length; k++) {
                                componentList[employeeComponents[k].name] = 0
                            }

                        }

                        if (componentList.hasOwnProperty(componentName)) {
                            managers[i].production[componentName] = 0;
                            this.maxProdComponents[componentName] = false;
                            $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents
                        }
                    }
                };

                this.getRequirementsByFeature = function(feature) {

                    var requirementNames = Object.getOwnPropertyNames(feature.requirements);
                    var moduleNames = requirementNames.filter(x => x.includes("Module"));

                    if (moduleNames.length > 0){
                        var modules = moduleNames.map(x => Components.find(y => y.name === x));
                        for(var i = 0; i < modules.length; i++){
                            requirementNames = requirementNames.concat(this.getRequirementsByModule(modules[i]));
                        }
                    }
                    return requirementNames.filter(onlyUnique);
                };

                this.maxFeature = function(feature){

                    var requirementNames = this.getRequirementsByFeature(feature);

                    for(var i = 0; i < requirementNames.length; i++){
                        this.maxProduction(requirementNames[i])
                    }

                    var features = this.featureList[this.tab];
                    for(i = 0; i < features.length; i++){

                        if(features[i].featureName === feature.featureName){
                            this.featureList[this.tab][i].maxProd = true
                        }
                    }
                };


                this.isRequirementDependsOnAnotherActiveFeature = function (currentFeature, requirementName) {

                    var allFeatures = [].concat.apply([], Object.values(this.featureList));
                    var activeFeatures = allFeatures.filter(x => x.maxProd === true);

                    if (activeFeatures.length < 2){
                        return false;
                    }
                    else{
                        var currentFeatureIndex = activeFeatures.findIndex(x => x.featureName === currentFeature.featureName);
                        activeFeatures.splice(currentFeatureIndex, 1);
                        for(var i = 0; i < activeFeatures.length; i++){
                            var requirementNames = this.getRequirementsByFeature(activeFeatures[i]);
                            if(requirementNames.findIndex(x => x === requirementName) !== -1){
                                return true;
                            }
                        }
                    }
                    return false;
                };

                this.minFeature = function(feature){
                    var requirementNames = this.getRequirementsByFeature(feature);

                    for(var i = 0; i < requirementNames.length; i++){
                        if(!this.isRequirementDependsOnAnotherActiveFeature(feature, requirementNames[i])){
                            this.minProduction(requirementNames[i])
                        }
                    }

                    var features = this.featureList[this.tab];
                    for(i = 0; i < features.length; i++){

                        if(features[i].featureName === feature.featureName){
                            this.featureList[this.tab][i].maxProd = false
                        }
                    }
                };
            }
        },
    ]
};

exports.onLoadGame = settings => {
    $('head').append(`<link id="vcmod_stylesheet" rel="stylesheet" type="text/css" href="${_modPath}/css/style.css">`);
};

exports.onUnsubscribe = done => {

};