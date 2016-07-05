var total = 0,
	sections = ["tires", "engine", "drivetrain", "suspension", "chassis", "aerodynamics", "rollcage"],
	subtotals = {},
	rules = {},
	baseClassTireSizes = {
		TTB: 265,
		TTC: 255,
		TTD: 245,
		TTE: 235,
		TTF: 215,
		TTG: 195,
		TTH: 175,
	},
	classOrder = ["TTH", "TTF", "TTE", "TTD", "TTC", "TTB", "TTU123"],
	savedBaseClass = "TTD",
	defaultWeight = 3000,
	currentClass;

function init(){
	$.each(sections, function(index, section){
		subtotals[section] = {
			subtotal: 0,
			rules: {}
		};
	});

	buildTireSizeSlider();
	$("#base-weight-input").val(defaultWeight).trigger("change");
	$("#baseClassSelect").val(savedBaseClass).trigger("change");
};

$("form").on("submit", function(event){
	event.preventDefault();
});

$("#baseClassSelect").on("change", function(baseClassSelect){
	var $baseClassSelect = $(baseClassSelect.target),
		baseClass = $baseClassSelect.val(),
		baseClassTireSize = baseClassTireSizes[baseClass];

	savedBaseClass = baseClass;
	$("#base-tire-size").html(baseClassTireSize);
	$("#tire-slider").get(0).noUiSlider.set(baseClassTireSize);
});

$(".radio-input").on("change", function(radio){
	var $radio = $(radio.target),
		points = parseInt($radio.val()),
		name = $radio.attr("name")
		section = $radio.data("section");

	updateTotalPoints(name, points);
	updateSectionPoints(name, points, section);
	calculateClass();
});

$(".checkbox-input").on("change", function(checkbox){
	var $checkbox = $(checkbox.target),
		points = parseInt($checkbox.data("points")),
		name = $checkbox.attr("name")
		section = $checkbox.data("section");

	if(rules[name]){
		total -= rules[name];
		rules[name] = null;
	} else {
		total += points;
		rules[name] = points;
	}

	$("#calculatedPoints").html(total);

	if(subtotals[section].rules[name]){
		subtotals[section].subtotal -= subtotals[section].rules[name];
		subtotals[section].rules[name] = null;
	} else {
		subtotals[section].subtotal += points;
		subtotals[section].rules[name] = points;
	}

	$("#subtotal-" + section).html(subtotals[section].subtotal);

	calculateClass();
});

$(".dropdown-input").on("change", function(select){
	var $select = $(select.target),
		points = parseInt($select.val()),
		name = $select.attr("name"),
		section = $select.data("section");

	updateTotalPoints(name, points);
	updateSectionPoints(name, points, section);
	calculateClass();
});

$(".tire-size-input").on("change", function(){
	var actualTireSize = parseInt($("#actualTireSize").val()),
		baseClassTireSize = parseInt($("#baseClassTireSize").val()),
		difference = actualTireSize - baseClassTireSize,
		tireSizePoints = determineTirePoints(difference);

	$("#tireSizeDifference").html(difference);
	$("#tireSizePoints").html(tireSizePoints);

	updateTotalPoints("tireSize", tireSizePoints);
	updateSectionPoints("tireSize", tireSizePoints, "tires");
	calculateClass();
});

$(".nav-item").click(function(navItem){
	var $navItem = $(navItem.target),
		section = $navItem.data("section");

	if(section == "all"){
		$(".section-form").addClass("show-section-form");
		$(".nav-item").removeClass("btn-danger");
		$navItem.addClass("btn-danger");
		$(".next-button").hide();
	}else{
		$(".next-button").show();
		$(".section-form").removeClass("show-section-form");
		$("#form-"+section).addClass("show-section-form");
		$(".nav-item").removeClass("btn-danger");
		$navItem.addClass("btn-danger");
	}
});

$(".next-button").click(function(navItem){
	var $navItem = $(navItem.target),
		section = $navItem.data("section");

	$(".section-form").removeClass("show-section-form");
	$("#form-"+section).addClass("show-section-form");
	$(".nav-item").removeClass("btn-danger");
	$('.nav-item[data-section="' + section + '"]').addClass("btn-danger");
	$('html, body').animate({
        scrollTop: $(".class-point-panel").offset().top
    }, 500);
	$(".class-point-panel").scrollTop(0);
});

function buildTireSizeSlider(){
	noUiSlider.create($("#tire-slider").get(0), {
		start: baseClassTireSizes[savedBaseClass],
		step: 5,
		range: {
			'min': 145,
			'max': 375
		}
	});

	$("#tire-slider").get(0).noUiSlider.on('update', function( values, handle ) {
		var value = parseInt(values[handle]),
			baseClassTireSize = baseClassTireSizes[savedBaseClass],
			difference = value - baseClassTireSize,
			tireSizePoints = determineTirePoints(difference);

		$("#tireSizeDifference").html(difference);
		$("#tireSizePoints").html(tireSizePoints);

		updateTotalPoints("tireSize", tireSizePoints);
		updateSectionPoints("tireSize", tireSizePoints, "tires");
		calculateClass();;
		$("#tire-size-value").html(value);
	});
};

$("#base-weight-input").on("change", function(){
	var value = parseInt($("#base-weight-input").val());
	$(".base-weight-value").html(value);
	$("#competition-weight-input").val(value).trigger("change");
});

$("#competition-weight-input").on("change", function(){
	calculateWeightPoints();
});

function calculateWeightPoints(){
	var competitionWeight = parseInt($("#competition-weight-input").val()),
		baseWeight = parseInt($("#base-weight-input").val()),
		difference = baseWeight - competitionWeight,
		weightPoints = determineWeightPoints(difference);

	$("#weightDifference").html(difference);
	$("#weightPoints").html(weightPoints);
	$("#subtotal-weight").html(weightPoints);

	updateTotalPoints("weight", weightPoints);
	calculateClass();
};

function determineWeightPoints(weightDifference){
	weightReduction.sort(function(first, second){
		return second.max - first.max;
	});

	for(var i = 0; i < weightReduction.length; i++){
		if(weightDifference >= weightReduction[i].max){
			return weightReduction[i].points;
		}
	}
	return 0;
};

function calculateClass(){
	classIncrement.sort(function(first, second){
		return second.max - first.max;
	});

	for(var i = 0; i < classIncrement.length; i++){
		if(total >= classIncrement[i].max){
			return updateClass(incrementClass(savedBaseClass, classIncrement[i].classIncrement), classIncrement[i].nextClass);
		}
	}
	return 0;
};

function updateClass(newClass, nextClass){
	if(newClass != currentClass){
		currentClass = newClass;
		$("#calculatedClass").html(newClass);
		if(nextClass){
			$("#pointsSlash").show();
			$("#pointsUntilNextClass").html(nextClass);
		}else{
			$("#pointsSlash").hide();
			$("#pointsUntilNextClass").html("");
		}
	}
};

function incrementClass(baseClass, amount){
	var baseClassIndex = classOrder.indexOf(baseClass),
		newClassIndex = baseClassIndex + amount;

	if(newClassIndex < 0){
		return classOrder[0];
	} else if(newClassIndex >= classOrder.length){
		return classOrder[classOrder.length - 1];
	} else {
		return classOrder[newClassIndex];
	}
};

function updateTotalPoints(name, points){
	if(rules[name]){
		total -= rules[name];
	}

	total += points;
	rules[name] = points;

	$("#calculatedPoints").html(total);
};

function updateSectionPoints(name, points, section){
	if(subtotals[section].rules[name]){
		subtotals[section].subtotal -= subtotals[section].rules[name];
	}

	subtotals[section].subtotal += points;
	subtotals[section].rules[name] = points;

	$("#subtotal-" + section).html(subtotals[section].subtotal);
};

function determineTirePoints(tireSizeDifference){
	tireSize.sort(function(first, second){
		return second.max - first.max;
	});

	for(var i = 0; i < tireSize.length; i++){
		if(tireSizeDifference >= tireSize[i].max){
			return tireSize[i].points;
		}
	}
	return 0;
};

var classIncrement = [
	{
		max: 160,
		classIncrement: 8,
		message: "160 thru 179 points - Up EIGHT Classes"
	}, {
		max: 140,
		classIncrement: 7,
		message: "140 thru 159 points - Up SEVEN Classes",
		nextClass: 159
	}, {
		max: 120,
		classIncrement: 6,
		message: "120 thru 139 points - Up SIX Classes",
		nextClass: 139
	}, {
		max: 100,
		classIncrement: 5,
		message: "100 thru 119 points - Up FIVE Classes",
		nextClass: 119
	}, {
		max: 80,
		classIncrement: 4,
		message: "80 thru 99 points - Up FOUR Classes",
		nextClass: 99
	}, {
		max: 60,
		classIncrement: 3,
		message: "60 thru 79 points - Up THREE Classes",
		nextClass: 79
	}, {
		max: 40,
		classIncrement: 2,
		message: "40 thru 59 points - Up TWO Classes",
		nextClass: 59
	}, {
		max: 20,
		classIncrement: 1,
		message: "20 thru 39 points - Up ONE Class",
		nextClass: 39
	}, {
		max: -19,
		classIncrement: 0,
		message: "0 thru 19 points - stay in base class",
		nextClass: 19
	}, {
		max: -39,
		classIncrement: -1,
		message: "drop 1 class"
	}, {
		max: -59,
		classIncrement: -2,
		message: "drop 2 classes"
	}, {
		max: -79,
		classIncrement: -3,
		message: "drop 3 classes"
	}, {
		max: -99,
		classIncrement: -4,
		message: "drop 4 classes"
	}, {
		max: -119,
		classIncrement: -5,
		message: "drop 5 classes"
	}, {
		max: -139,
		classIncrement: -6,
		message: "drop 6 classes"
	}, {
		max: -999999999,
		classIncrement: -1,
		message: "drop 7 classes"
	}		
];

var tireSize = [
	{
		max: 110,
		points: 31
	}, {
		max: 100,
		points: 28
	}, {
		max: 90,
		points: 25
	}, {
		max: 80,
		points: 22
	}, {
		max: 70,
		points: 19
	}, {
		max: 60,
		points: 16
	}, {
		max: 50,
		points: 13
	}, {
		max: 40,
		points: 10
	}, {
		max: 30,
		points: 7
	}, {
		max: 20,
		points: 4
	}, {
		max: 10,
		points: 1
	}, {
		max: -9,
		points: 0
	}, {
		max: -19,
		points: -1
	}, {
		max: -29,
		points: -4
	}, {
		max: -999999999,
		points: -7
	}
];

var weightReduction = [
	{
		max: 0,
		points:	0
	}, {
		max: 6,
		points:	1
	}, {
		max: 21,
		points:	2
	}, {
		max: 36,
		points:		3
	}, {
		max: 51,
		points:		4
	}, {
		max: 66,
		points:		5
	}, {
		max: 81,
		points:		6
	}, {
		max: 96,
		points:		7
	}, {
		max: 111,
		points:		8
	}, {
		max: 126,
		points:		9
	}, {
		max: 141,
		points:		10
	}, {
		max: 156,
		points:		11
	}, {
		max: 171,
		points:		12
	}, {
		max: 186,
		points:		13
	}, {
		max: 201,
		points:		14
	}, {
		max: 216,
		points:		15
	}, {
		max: 231,
		points:		16
	}, {
		max: 246,
		points:		17
	}, {
		max: 261,
		points:		18
	}, {
		max: 276,
		points:		19
	}, {
		max: 291,
		points:		20
	}, {
		max: 306,
		points:		21
	}, {
		max: 321,
		points:		22
	}, {
		max: 336,
		points:		23
	}, {
		max: 351,
		points:		24
	}, {
		max: 366,
		points:		25
	}, {
		max: 381,
		points:		26
	}, {
		max: 396,
		points:		27
	}, {
		max: 411,
		points:		28
	}, {
		max: 426,
		points:		29
	}, {
		max: 441,
		points:		30
	}, {
		max: 456,
		points:		31
	}, {
		max: 461,
		points:		32
	}, {
		max: 476,
		points:		33
	}, {
		max: 491,
		points:		34
	}, {
		max: 506,
		points:		35
	}, {
		max: 521,
		points:		36
	}, {
		max: 536,
		points:		37
	}, {
		max: 551,
		points:		38
	}, {
		max: 566,
		points:		39
	}, {
		max: 581,
		points:		40
	}, {
		max: 596,
		points:		41
	}, {
		max: 611,
		points:		42
	}, {
		max: 626,
		points:		43
	}, {
		max: 641,
		points:		44
	}, {
		max: 656,
		points:		45
	}, {
		max: 671,
		points:		46
	}, {
		max: 686,
		points:		47
	}, {
		max: 701,
		points:		48
	}, {
		max: 716,
		points:		49
	}, {
		max: 731,
		points:		50
	}, {
		max: 746,
		points:		51
	}, {
		max: 761,
		points:		52
	}, {
		max: 776,
		points:		53
	}, {
		max: 791,
		points:		54
	}, {
		max: 806,
		points:		55
	}, {
		max: 821,
		points:		56
	}, {
		max: 836,
		points:		57
	}, {
		max: 851,
		points:		58
	}, {
		max: 866,
		points:		59
	}, {
		max: 881,
		points:		60
	}, {
		max: 896,
		points:		61
	}, {
		max: 911,
		points:		62
	}, {
		max: 926,
		points:		63
	}, {
		max: 941,
		points:		64
	}, {
		max: 956,
		points:		65
	}, {
		max: 971,
		points:		66
	}, {
		max: 986,
		points:		67
	}, {
		max: 1001,
		points:		68
	}, {
		max: 1016,
		points:		69
	}, {
		max: 1031,
		points:		70
	}, {
		max: 1046,
		points: 71
	}, {
		max: 1061,
		points:	72
	}, {
		max: 1076,
		points:	73
	}, {
		max: 1091,
		points:	74
	}, {
		max: 1106,
		points:	75
	}, {
		max: 1121,
		points:	76
	}, {
		max: 1136,
		points:	77
	}, {
		max: 1151,
		points:	78
	}, {
		max: 1166,
		points:	79
	}, {
		max: 1181,
		points:	80
	}, {
		max: 1196,
		points:	81
	}, {
		max: 1211,
		points:	82
	}, {
		max: 1226,
		points:	83
	}, {
		max: 1241,
		points:	84
	}, {
		max: 1256,
		points:	85
	}, {
		max: 1271,
		points:	86
	}, {
		max: 1286,
		points:	87
	}, {
		max: 1301,
		points:	88
	}, {
		max: 1316,
		points:	89
	}, {
		max: 1331,
		points:	90
	}, {
		max: 1346,
		points:	91
	}, {
		max: 1361,
		points:	92
	}, {
		max: 1376,
		points:	93
	}, {
		max: 1391,
		points:	94
	}, {
		max: 1406,
		points:	95
	}, {
		max: 1421,
		points:	96
	}, {
		max: 1436,
		points:	97
	}, {
		max: 1451,
		points: 98
	}, {
		max: 1466,
		points:	99
	}, {
		max: 1481,
		points:	100
	}, {
		max: 1496,
		points:	101
	}, {
		max: 1511,
		points:	102
	}, {
		max: 1526,
		points:	103
	}, {
		max: 1541,
		points:	104
	}, {
		max: 1556,
		points:	105
	}, {
		max: 1571,
		points:	106
	}, {
		max: 1586,
		points:	107
	}, {
		max: 1601,
		points:	108
	}, {
		max: 1616,
		points:	109
	}, {
		max: 1631,
		points:	110
	}, {
		max: 1646,
		points:	111
	}, {
		max: 1661,
		points:	112
	}, {
		max: 1676,
		points:	113
	}, {
		max: 1691,
		points:	114
	}, {
		max: 1706,
		points:	115
	}, {
		max: 1721,
		points:	116
	}, {
		max: 1736,
		points:	117
	}, {
		max: 1751,
		points:	118
	}, {
		max: 1766,
		points:	119
	}, {
		max: 1781,
		points:	120
	}, {
		max: 1796,
		points:	121
	}, {
		max: 1811,
		points:	122
	}, {
		max: 1826,
		points:	123
	}, {
		max: 1841,
		points:	124
	}, {
		max: 1856,
		points:	125
	}, {
		max: 1871,
		points:	126
	}, {
		max: 1886,
		points:	127
	}, {
		max: 1901,
		points:	128
	}, {
		max: 1916,
		points:	129
	}, {
		max: 1931,
		points:	130
	}, {
		max: 1946,
		points:	131
	}, {
		max: 1961,
		points:	132
	}, {
		max: 1976,
		points:	133
	}, {
		max: 1991,
		points:	134
	}, {
		max: 2006,
		points:	135
	}, {
		max: 2021,
		points:	136
	}, {
		max: 2036,
		points:	137
	}, {
		max: 2051,
		points:	138
	}, {
		max: 2066,
		points:	139
	}, {
		max: 2081,
		points:	140
	}, {
		max: 2096,
		points:	141
	}, {
		max: 2111,
		points:	142
	}, {
		max: 2126,
		points:	143
	}, {
		max: 2141,
		points:	144
	}, {
		max: 2156,
		points:	145
	}, {
		max: 2171,
		points:	146
	}, {
		max: 2186,
		points:	147
	}, {
		max: 2201,
		points:	148
	}, {
		max: 2216,
		points:	149
	}, {
		max: 2231,
		points:	150
	}, {
		max: 2246,
		points:	151
	}, {
		max: 2261,
		points:	152
	}, {
		max: 2276,
		points:	153
	}, {
		max: 2291,
		points:	154
	}, {
		max: 2306,
		points:	155
	}, {
		max: 2321,
		points:	156
	}, {
		max: 2336,
		points:	157
	}, {
		max: 2351,
		points:	158
	}, {
		max: 2366,
		points:	159
	}, {
		max: 2381,
		points:	160
	}, {
		max: 2396,
		points:	161
	}, {
		max: 2411,
		points:	162
	}, {
		max: 2426,
		points:	163
	}, {
		max: 2441,
		points:	164
	}, {
		max: 2456,
		points:	165
	}, {
		max: 2471,
		points:	166
	}, {
		max: 2486,
		points:	167
	}, {
		max: 2501,
		points:	168
	}, {
		max: 2516,
		points:	169
	}, {
		max: 2531,
		points:	170
	}, {
		max: 2546,
		points:	171
	}, {
		max: 2561,
		points:	172
	}, {
		max: 2576,
		points:	173
	}, {
		max: 2591,
		points:	174
	}, {
		max: 2606,
		points:	175
	}, {
		max: 2621,
		points:	176
	}, {
		max: 2636,
		points:	177
	}, {
		max: 2651,
		points:	178
	}, {
		max: 2666,
		points:	179
	}, {
		max: 2681,
		points:	180
	}, {
		max: 2696,
		points:	181
	}, {
		max: 2711,
		points:	182
	}, {
		max: 2726,
		points:	183
	}, {
		max: 2741,
		points:	184
	}, {
		max: 2756,
		points:	185
	}, {
		max: 2771,
		points:	186
	}, {
		max: 2786,
		points:	187
	}, {
		max: 2801,
		points:	188
	}, {
		max: 2816,
		points:	189
	}, {
		max: 2831,
		points:	190
	}, {
		max: 2846,
		points:	191
	}, {
		max: 2861,
		points:	192
	}, {
		max: 2876,
		points:	193
	}, {
		max: 2891,
		points:	194
	}, {
		max: 2906,
		points:	195
	}, {
		max: 2921,
		points:	196
	}, {
		max: 2936,
		points:	197
	}, {
		max: 2951,
		points:	198
	}, {
		max: 2966,
		points:	199
	}, {
		max: 2981,
		points:	200
	}, {
		max: 2996,
		points:	201
	}, {
		max: 3011,
		points:	202
	}, {
		max: 3026,
		points:	203
	}, {
		max: 3041,
		points:	204
	}, {
		max: 3056,
		points:	205
	}, {
		max: 3071,
		points:	206
	}, {
		max: 3086,
		points:	207
	}, {
		max: 3101,
		points:	208
	}, {
		max: 3116,
		points:	209
	}
];

init();