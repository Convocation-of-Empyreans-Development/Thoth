var corporations = [
	{
		name: "Aideron Robotics",
		ticker: "AIDER",
		tag: "AIDER"
	}, {
		name: "Mecha Enterprises Fleet",
		ticker: "XMETA",
		tag: "XMETA"
	}, {
		name: "Jerkasaurus Wrecks Inc.",
		ticker: "JREX",
		tag: "JREX"
	},  {
		name: "Alwar Fleet",
		ticker: "ALWAR",
		tag: "ALWAR"
	}, {
		name: "17th Squadron",
		ticker: "SQRON",
		tag: "SQRON"
	},
	{
		name: "Federal Vanguard",
		ticker: "FEVAN",
		tag: "FEVAN"
	}
];

corporations.searchByName = function (name){
	console.log("searchByName " + name);
	console.log(corporations[1]);
	for (var i = 0; i < corporations.length; i++){
		console.log("testing " + corporations[i].name);
		if (corporations[i].name == name)
		{
			console.log("returning " + corporations[i].name);
			console.log(corporations[i]);
			return corporations[i];
		}
	}
	return null
};

corporations.searchByTicker = function (ticker){
	console.log("searchByTicker" + ticker);

	for (var i = 0; i < corporations.length; i++){
		console.log("testing " + corporations[i].ticker);
		if (corporations[i].ticker == ticker)
		{
			console.log("returning " + corporations[i].ticker);
			console.log(corporations[i]);
			return corporations[i];
		}
	}
	return null
};

module.exports = corporations;
