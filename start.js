let _modPath;

function Team(teamId, name, members, status, assignedFeatures){

    this.teamId = teamId;
    this.teamName = name;
    this.members = members;
    this.status = status;
    this.assignedFeatures = assignedFeatures;

}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

const debug = str => Helpers.ConsoleInfo(`[MOD] Macro-Management Mod: ${str}`);

exports.initialize = (modPath) => {
    _modPath = modPath;

    // Add Macro-Management Mod.
    Modding.setMenuItem({
        name: 'mmmod',
        tooltip: "Macro-Management Mod",
        tooltipPosition: 'top',
        faIcon: 'fa fa-black-tie',
        badgeCount: 0,
    });

    debug('Loaded Macro-Management Mod');

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
                if(this.productList.length < 1){
                    this.tab = 'components';
                }
                else{
                    this.tab = this.productList[0].name;
                }

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

                    // clean up if there are missing products
                    if(Object.getOwnPropertyNames(this.featureList).length > this.productList.length){

                        var featureListKeys = Object.getOwnPropertyNames(this.featureList);
                        for(var i = 0; i < featureListKeys.length; i++){
                            if(!this.productList.map(x => x.name).includes(featureListKeys[i]) || this.productList.length === 0){
                                delete this.featureList[featureListKeys[i]];
                            }
                        }
                    }

                    for(i = 0; i < this.productList.length; i++){

                        var actualFeatures = this.getFeaturesByProductName(this.productList[i].name);
                        // a new product is added, its feature list will be empty (null at first)
                        if(this.featureList[this.productList[i].name] == null){
                            this.featureList[this.productList[i].name] = [];
                        }
                        var savedFeatures = this.featureList[this.productList[i].name];

                        var actualFeatureNames = actualFeatures.map(a => a.featureName);
                        var savedFeatureNames = [];
                        if(savedFeatures.length > 0){
                            savedFeatureNames = savedFeatures.map(a => a.featureName);
                        }

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

                this.isMaxProd = function(featureIndex){
                    return this.featureList[this.tab][featureIndex].maxProd;
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
                        // 0 -> false 1 -> neutral 2-> true
                        this.maxProdComponents[Components[i].name] = 1;
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
                    return Employees[Employees.findIndex(x => x.id === id)]

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

                    let allTeamMembers = [].concat.apply([], this.teams.map(x => x.members));
                    let allManagers = this.getEmployeesByType("Manager");
                    // managers without any teams
                    let managers = allManagers.filter(x => !allTeamMembers.map(y => y.id).includes(x.id));

                    for (var i = 0; i < managers.length; i++) {

                        let allComponentNames = this.getManagerEmployeesAvailableComponents(managers[i]);

                        if (allComponentNames.includes(componentName)) {
                            managers[i].production[componentName] = 9999;
                            this.maxProdComponents[componentName] = 2;
                            $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents
                        }

                    }
                };

                this.stopOverride = function (componentName){

                    this.maxProdComponents[componentName] = 1;
                    $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents

                };

                this.minProduction = function (componentName) {

                    let allTeamMembers = [].concat.apply([], this.teams.map(x => x.members));
                    let allManagers = this.getEmployeesByType("Manager");
                    // managers without any teams
                    let managers = allManagers.filter(x => !allTeamMembers.map(y => y.id).includes(x.id));

                    for (var i = 0; i < managers.length; i++) {

                        let allComponentNames = this.getManagerEmployeesAvailableComponents(managers[i]);

                        if (allComponentNames.includes(componentName)) {
                            managers[i].production[componentName] = 0;
                            this.maxProdComponents[componentName] = 0;
                            $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents
                        }
                    }
                };

                this.minProductionOfTeam = function(componentNames, teamManagers){

                    let teamManagerIds = teamManagers.map(x => x.id);
                    var managers = this.getEmployeesByType("Manager").filter(x => teamManagerIds.includes(x.id));

                    for (var i = 0; i < managers.length; i++) {

                        let allComponentNames = this.getManagerEmployeesAvailableComponents(managers[i]);

                        let intersection = allComponentNames.filter(x => componentNames.includes(x)).filter(onlyUnique);

                        for (var j = 0; j < intersection.length; j++){
                            if(this.maxProdComponents[intersection[j]] !== 2)
                                managers[i].production[intersection[j]] = 0;
                        }
                    }
                };

                this.maxProductionOfTeam = function (componentNames, teamManagers) {

                    let teamManagerIds = teamManagers.map(x => x.id);
                    var managers = this.getEmployeesByType("Manager").filter(x => teamManagerIds.includes(x.id));

                    for (var i = 0; i < managers.length; i++) {

                        let allComponentNames = this.getManagerEmployeesAvailableComponents(managers[i]);

                        let intersection = allComponentNames.filter(x => componentNames.includes(x)).filter(onlyUnique);
                        for (var j = 0; j < intersection.length; j++){
                            if(this.maxProdComponents[intersection[j]] !== 0)
                                managers[i].production[intersection[j]] = 9999;
                        }
                    }
                };

                this.minProductionOfManagersInTeam = function(teamManagers){
                    let teamManagerIds = teamManagers.map(x => x.id);
                    var managers = this.getEmployeesByType("Manager").filter(x => teamManagerIds.includes(x.id));
                    for (var i = 0; i < managers.length; i++) {

                        let allComponentNames = this.getManagerEmployeesAvailableComponents(managers[i]);

                        for (var j = 0; j < allComponentNames.length; j++){
                            if(this.maxProdComponents[allComponentNames[j]] !== 2)
                                managers[i].production[allComponentNames[j]] = 0;
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

                this.maxFeature = function(product, feature, featureIndex){

                    var requirementNames = this.getRequirementsByFeature(feature);
                    //if a team is assigned, find team members (managers) and maxProduction the requirements with ONLY those team members
                    if(this.featureList[product.name][featureIndex].assignedTeam != null){
                        var assignedTeam = this.featureList[product.name][featureIndex].assignedTeam;
                        var employees = assignedTeam.members;

                        this.maxProductionOfTeam(requirementNames, employees);

                        var teamIndex = this.teams.findIndex(x => x.teamId === assignedTeam.teamId);
                        this.teams[teamIndex].status += 1;
                        let featIndex = this.teams[teamIndex].assignedFeatures.findIndex(x => x.id === feature.id);
                        this.teams[teamIndex].assignedFeatures[featIndex].maxProd = true;
                        $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                    }
                    //if a team is not assigned, find managers WITHOUT any assigned team, maxProduction the requirements with ONLY those managers
                    else{
                        let allTeamMembers = [].concat.apply([], this.teams.map(x => x.members));
                        let allManagers = this.getEmployeesByType("Manager");

                        let difference = allManagers.filter(x => !allTeamMembers.map(y => y.id).includes(x.id));

                        // let's consider the difference as a "global team"
                        this.maxProductionOfTeam(requirementNames, difference);
                    }

                    this.featureList[product.name][featureIndex].maxProd = true;
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList;
                };

                this.isRequirementDependsOnAnotherActiveFeature = function (currentFeature, requirementName) {

                    var allFeatures = [].concat.apply([], Object.values(this.featureList));
                    // feature belongs to a team
                    if (currentFeature.assignedTeam != null){
                        allFeatures = allFeatures.filter(x => x.assignedTeam != null);
                        allFeatures = allFeatures.filter(x => x.assignedTeam.teamId === currentFeature.assignedTeam.teamId);
                    }
                    // feature does not belong to a team (or belongs to the global team)
                    else{
                        allFeatures = allFeatures.filter(x => x.assignedTeam == null);
                    }

                    var activeFeatures = allFeatures.filter(x => x.maxProd === true);

                    if (activeFeatures.length < 2){
                        return false;
                    }
                    else{
                        var currentFeatureIndex = activeFeatures.findIndex(x => x.id === currentFeature.id);
                        activeFeatures.splice(currentFeatureIndex, 1);
                        for(var i = 0; i < activeFeatures.length; i++){
                            var requirementNames = this.getRequirementsByFeature(activeFeatures[i]);
                            if(requirementNames.includes(requirementName)){
                                return true;
                            }
                        }
                    }
                    return false;
                };

                this.minFeature = function(product, feature, featureIndex){

                    var requirementNames = this.getRequirementsByFeature(feature);
                    requirementNames = requirementNames.filter(x =>
                        !this.isRequirementDependsOnAnotherActiveFeature(this.featureList[product.name][featureIndex], x));

                    if(this.featureList[product.name][featureIndex].assignedTeam != null){
                        var assignedTeam = this.featureList[product.name][featureIndex].assignedTeam;
                        var employees = assignedTeam.members;

                        this.minProductionOfTeam(requirementNames, employees);

                        var teamIndex = this.teams.findIndex(x => x.teamId === assignedTeam.teamId);
                        this.teams[teamIndex].status -= 1;
                        let featIndex = this.teams[teamIndex].assignedFeatures.findIndex(x => x.id === feature.id);
                        this.teams[teamIndex].assignedFeatures[featIndex].maxProd = false;
                        $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                    }
                    else{
                        let allTeamMembers = [].concat.apply([], this.teams.map(x => x.members));
                        let allManagers = this.getEmployeesByType("Manager");

                        let difference = allManagers.filter(x => !allTeamMembers.map(y => y.id).includes(x.id));

                        // let's consider the difference as a "global team"
                        this.minProductionOfTeam(requirementNames, difference);
                    }

                    this.featureList[product.name][featureIndex].maxProd = false;
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList;
                };

                // TEAM FUNCTIONALITY

                // Load teams from save if it exists
                if($rootScope.settings.hasOwnProperty("MacroManagementMod")) {
                    if($rootScope.settings.MacroManagementMod.hasOwnProperty("teams")){
                        this.teams = $rootScope.settings.MacroManagementMod["teams"];
                    }
                }
                // create teams object for the first time
                if(this.teams == null){
                    this.teams = [];
                    var allComponentNames = Components.map(x => x.name);
                    for(let i = 0; i < allComponentNames.length; i++){
                        this.maxProdComponents[allComponentNames[i]] = 1;
                    }
                    $rootScope.settings.MacroManagementMod["maxProdComponents"] = this.maxProdComponents;
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                }

                this.selectedManagers = [];
                this.tempTeamName = "";
                // for editing and assigning a team
                this.selectedTeam = null;

                this.getAllManagers = function(){

                    var allManagers = this.getEmployeesByType("Manager");
                    allManagers.map(x => x.numOfDevs = this.getManagerEmployeeCountByType(x, "Developer"));
                    allManagers.map(x => x.numOfLeadDevs = this.getManagerEmployeeCountByType(x, "LeadDeveloper"));
                    allManagers.map(x => x.numOfDesigners = this.getManagerEmployeeCountByType(x, "Designer"));
                    allManagers = allManagers.filter(x => this.getManagerEmployeeCount(x) > 0);

                    return allManagers
                };

                this.getManagerEmployeeCountByType = function(manager, type){

                    var employees = this.getEmployeesByType(type);
                    return employees.filter(x => x.managerId === manager.id).length;

                };

                this.getManagerEmployees = function(manager){

                    var employees = this.getAllEmployees();
                    return employees.filter(x => x.managerId === manager.id);

                };

                this.getComponentsByEmployeeType = function(employeeType){

                    return Components.filter(x => x.employeeTypeName === employeeType).map(x => x.name);

                };

                this.getUnlockedComponentsByEmployeeTypeAndLevels = function(employeeType){

                    let employeeTypeComponents = this.getComponentsByEmployeeType(employeeType);
                    let unlockedComponents = _.flatMap($rootScope.settings.researchedItems.map(e => ResearchItems.find(t => t.name === e)).filter(e => "Component" === e.unlockType), e => e.unlocks);
                    // TODO: Careful about employee levels
                    //let employeeComponents = employeeTypeComponents.filter(x => levels.includes(x.employeeLevel));
                    return unlockedComponents.filter(x => employeeTypeComponents.includes(x)).filter(onlyUnique);

                };

                this.getManagerEmployeesAvailableComponents = function(manager){

                    let managerEmployees = this.getManagerEmployees(manager);
                    // TODO: Careful about employee levels
                    //let managerEmployeeLevels = managerEmployees.map(x => x.level).filter(onlyUnique);

                    let availableComponents = [].concat.apply([], managerEmployees.map(x => this.getUnlockedComponentsByEmployeeTypeAndLevels(x.employeeTypeName)));
                    return availableComponents.filter(onlyUnique);

                };

                this.getManagerEmployeeCount = function(manager){

                    return manager.numOfDevs + manager.numOfDesigners + manager.numOfLeadDevs;

                };

                this.getProductById = function(id){

                    var products = this.getCompanyProducts();
                    return products.find(x => x.id === id);

                };

                this.updateAssignedFeaturesWithEditedTeamName = function(){

                    var assignedFeatures = this.selectedTeam.assignedFeatures;
                    var assignedFeatureProducts = assignedFeatures.map(x => this.getProductById(x.productId).name);

                    for (var i = 0; i < assignedFeatures.length; i++){

                        var index = this.featureList[assignedFeatureProducts[i]].findIndex(x => x.id === assignedFeatures[i].id);
                        if(index !== -1){
                            let teamCopy = JSON.parse(JSON.stringify(this.selectedTeam));
                            this.featureList[assignedFeatureProducts[i]][index].assignedTeam = teamCopy;
                        }
                    }

                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList;
                };

                this.clearAssignedFeatureFromTeamAndFeatureList = function(product, featureIndex){

                    var team = this.featureList[product.name][featureIndex].assignedTeam;
                    var feature = this.featureList[product.name][featureIndex];

                    //clear feature from team in teams
                    var teamIndex = this.teams.findIndex(x => x.teamName === team.teamName);
                    var featIndex = this.teams[teamIndex].assignedFeatures.findIndex(x => x.id === feature.id);
                    this.teams[teamIndex].assignedFeatures.splice(featIndex, 1);

                    //clear team from feature in featureList
                    this.featureList[product.name][featureIndex].assignedTeam = null;
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList;
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                };

                this.clearAssignedFeaturesOfRemovedTeam = function(team){

                    var assignedFeatures = team.assignedFeatures;
                    var assignedFeatureProducts = assignedFeatures.map(x => this.getProductById(x.productId).name);

                    for (var i = 0; i < assignedFeatures.length; i++){

                        var index = this.featureList[assignedFeatureProducts[i]].findIndex(x => x.id === assignedFeatures[i].id);
                        if(index !== -1){
                            this.featureList[assignedFeatureProducts[i]][index].assignedTeam = null;
                        }
                    }
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList;
                };

                this.isManagerInATeam = function(manager){

                    var allManagersInTeams = [].concat.apply([], this.teams.map(x => x.members));
                    return allManagersInTeams.map(x => x.id).includes(manager.id)

                };

                this.getManagersByTeam = function (team) {

                    return this.teams[this.teams.findIndex(x => x.teamName === team.teamName)].members;

                };

                this.getNumberOfEmployeesInTeamByType = function(teamEmployees, type){

                    var idsOfManagers = teamEmployees.map(x => x.id);
                    var employees = this.getEmployeesByType(type);

                    return employees.filter(x => idsOfManagers.includes(x.managerId)).length;
                };

                this.getNumberOfEmployeesInTeam = function(teamEmployees){

                    var allEmployeesOfManagers = [].concat.apply([], teamEmployees.map(x => x.numberOfControlledEmployees));
                    return allEmployeesOfManagers.reduce((a, b) => a + b, 0)

                };

                this.removeSelectedManagerFromTeam = function(manager, team){
                    this.minProductionOfManagersInTeam([manager]);
                    var managerIndex = team.members.findIndex(x => x.id === manager.id);
                    team.members.splice(managerIndex, 1);

                    this.teams[this.teams.findIndex(x => x.teamName === team.teamName)] = team;
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                    this.updateAssignedFeaturesWithEditedTeamName();
                    this.refreshProduction();
                    this.selectedTeam = team;
                };

                this.addSelectedManagerToTeam = function(manager, team){

                    team.members.push(manager);

                    this.teams[this.teams.findIndex(x => x.teamName === team.teamName)] = team;
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;

                    this.updateAssignedFeaturesWithEditedTeamName();
                    this.minProductionOfManagersInTeam(team.members);
                    this.refreshProduction();
                    this.selectedTeam = team;
                };

                this.addOrRemoveSelectedManagers = function(employee){

                    if(this.selectedManagers.map(x => x.id).includes(employee.id)){
                        var index = this.selectedManagers.findIndex(x => x.id === employee.id);
                        this.selectedManagers.splice(index, 1);
                    }
                    else{
                        this.selectedManagers.push(employee);
                    }
                };

                this.isManagerSelected = function(manager){

                    if(this.selectedManagers.length > 0){
                        return this.selectedManagers.map(x => x.name).includes(manager.name);
                    }
                    return false;
                };

                this.addTeam = function(){

                    var team = new Team(this.teams.length + 1, this.tempTeamName, this.selectedManagers, 0, []);
                    this.teams.push(team);
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                    this.selectedManagers = [];
                    this.tempTeamName = "";
                    this.tab = 'teams';

                };

                this.removeTeam = function(team){
                    this.minProductionOfManagersInTeam(team.members);
                    this.clearAssignedFeaturesOfRemovedTeam(team);
                    this.teams.splice(this.teams.findIndex(x => x.teamId === team.teamId), 1);
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                    this.refreshProduction();
                };

                this.getTeamByAssignedFeature = function(feature){

                    var featuresByTeams = this.teams.map(x => x.assignedFeatures);
                    var teamIndex = -1;

                    for(var i = 0; i < featuresByTeams.length; i++){

                        if(featuresByTeams[i].findIndex(x => x.id === feature.id) !== -1){
                            teamIndex = i;
                            break;
                        }
                    }

                    if(teamIndex === -1){
                        return null;
                    }

                    return this.teams[teamIndex];
                };

                this.getTeamIndexByAssignedFeature = function(feature){

                    var featuresByTeams = this.teams.map(x => x.assignedFeatures);
                    var teamIndex = -1;

                    for(var i = 0; i < featuresByTeams.length; i++){

                        if(featuresByTeams[i].findIndex(x => x.id === feature.id) !== -1){
                            teamIndex = i;
                            break;
                        }
                    }

                    return teamIndex;
                };

                this.assignFeatureToTeam = function(product, feature, team, selectedFeatureIndex){

                    // if the feature is assigned to another team, it needs to be unassigned:
                    var previousTeamIndex = this.getTeamIndexByAssignedFeature(feature);
                    if(previousTeamIndex !== -1){
                        var featureIndex = this.teams[previousTeamIndex].assignedFeatures.findIndex(x => x.id === feature.id);
                        this.teams[previousTeamIndex].assignedFeatures.splice(featureIndex, 1);
                    }

                    this.teams[this.teams.findIndex(x => x.teamId === team.teamId)].assignedFeatures.push(feature);
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;
                    let teamCopy = JSON.parse(JSON.stringify(team));
                    this.featureList[product.name][selectedFeatureIndex].assignedTeam = teamCopy;
                    $rootScope.settings.MacroManagementMod["featureList"] = this.featureList;
                };

                this.isStillAManager = function(manager){
                    return this.getEmployeesByType("Manager").map(x => x.id).includes(manager.id);
                };

                this.isStillAFeature = function(feature){

                    var allFeatures = [].concat.apply([], Object.values(this.featureList));
                    return allFeatures.map(x => x.id).includes(feature.id);
                };

                this.isStillAnActiveFeature = function(feature){

                    var allFeatures = [].concat.apply([], Object.values(this.featureList));
                    let activeFeatures = allFeatures.filter(x => x.maxProd === true);
                    return activeFeatures.map(x => x.id).includes(feature.id);
                };

                this.refreshProduction = function(){

                    // Refresh team members, preventing mistakes if a manager is fired / resigned
                    // Also preventing mistakes if a product/feature is deleted
                    for(var i = 0; i < this.teams.length; i++){
                        this.teams[i].members = this.teams[i].members.filter(x => this.isStillAManager(x));
                        this.teams[i].assignedFeatures = this.teams[i].assignedFeatures.filter(x => this.isStillAFeature(x));
                        this.teams[i].status = this.teams[i].assignedFeatures.filter(x => this.isStillAnActiveFeature(x)).length;
                        this.minProductionOfManagersInTeam(this.teams[i].members);

                        this.selectedTeam = this.teams[i];
                        this.updateAssignedFeaturesWithEditedTeamName();
                        this.selectedTeam = null;
                    }

                    let products = this.getCompanyProducts();

                    for(i = 0; i < products.length; i++){
                        let features = this.featureList[products[i].name];
                        // min the features first
                        for(var j = 0; j < features.length; j++){
                            if(features[j].maxProd === true) {
                                this.minFeature(products[i], features[j], j);
                                features[j].maxProd = true;
                            }
                        }
                        // max the features again
                        for(j = 0; j < features.length; j++){
                            if(features[j].maxProd === true){
                                this.maxFeature(products[i], features[j], j);
                            }
                        }
                    }
                    $rootScope.settings.MacroManagementMod["teams"] = this.teams;

                    var allComponentNames = Components.map(x => x.name);
                    for(i = 0; i < allComponentNames.length; i++){
                        if(this.maxProdComponents[allComponentNames[i]] === 2){
                            this.maxProduction(allComponentNames[i]);
                        }
                        if(this.maxProdComponents[allComponentNames[i]] === 0){
                            this.minProduction(allComponentNames[i]);
                        }
                    }
                };

                this.refreshProduction();
            }
        },
    ]
};

exports.onLoadGame = settings => {
    $('head').append(`<link id="vcmod_stylesheet" rel="stylesheet" type="text/css" href="${_modPath}/css/style.css">`);
};

exports.onUnsubscribe = done => {

    //Restores everything to prepare for unsubscription from Steam Workshop
    const re = /^sg_.*json$/;

    delete GetRootScope().settings.MacroManagementMod;
    GetRootScope().saveGame();
    debug('Deleted \'$rootscope.settings.MacroManagementMod\'.');

    Remote.app.getAllFiles(files => {

        const savegames = files.filter(file => re.test(file));

        savegames.forEach((file, index) => Helpers.LoadSettings(file, settings => {
            delete settings.MacroManagementMod;
            Remote.app.saveFile(file, JSON.stringify(settings));

            if (index === savegames.length - 1) {
                done();
            }
        }));
    });
};