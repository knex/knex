const assert = require('chai').assert
const timestamp = require('../../lib/migrations/util/timestamp').yyyymmddhhmmss

const checkDates = [
	'2016-02-28T21:12:45.678',
	'2016-03-01T08:32:59.870',
	'2015-02-28T23:45:02.125',
	'2015-03-01T04:36:59.014',
	'2020-12-31T15:30:58.409',
	'2019-01-01T00:08:41.603',
	
	'1999-12-25T12:00:46.692'
]

const checkOffsets = [
	840,
	-840,
	840,
	-840,
	840,
	-840,
	
	60,   //ECT European Central Time
	120,  //EET Eastern European Time
	180,  //EAT Eastern African Time
	210,  //MET Middle Eastern Time
	240,  //NET Near Eastern Time
	300,  //PLT Pakistan Labor Time
	330,  //IST India Standard Time
	360,  //BST Bangladesh Standard Time
	420,  //VST Vietnam Standard Time
	480,  //CTT China Taiwan Time
	540,  //JST Japan Standard Time
	570,  //ACT Australia Central Time
	600,  //AET Australia Eastern Time
	660,  //SST Solomon Standard Time
	720,  //NST New Zealand Standard Time
	-660, //MIT Midway Islands Time
	-600, //HST Hawaii Standard Time
	-540, //AST Alaska Standard Time
	-480, //PST Pacific Standard Time
	-420, //MST Mountain Standard Time
	-360, //CST Central Standard Time
	-300, //EST Eastern Standard Time
	-240, //PRT Puerto rico and US Virgin Islands Time
	-210, //CNT Canada Newfoundland Time
	-180, //BET Brazil Eastern Time
	-60   //CAT Central African Time
]

const trueDate = [
	'20160229111245',
	'20160229183259',
	'20150301134502',
	'20150228143659',
	'20210101053058',
	'20181231100841',
	
	'19991225130046',
	'19991225140046',
	'19991225150046',
	'19991225153046',
	'19991225160046',
	'19991225170046',
	'19991225173046',
	'19991225180046',
	'19991225190046',
	'19991225200046',
	'19991225210046',
	'19991225213046',
	'19991225220046',
	'19991225230046',
	'19991226000046',
	'19991225010046',
	'19991225020046',
	'19991225030046',
	'19991225040046',
	'19991225050046',
	'19991225060046',
	'19991225070046',
	'19991225080046',
	'19991225083046',
	'19991225090046',
	'19991225110046'
]


describe('timestamp', function() {
	it('should return valid dates for edge cases of leap years', function() {
		let regex = new RegExp('[0-9]{14}')
		for (let i = 0; i < 6; i++) {
			let testDate = timestamp(checkDates[i], checkOffsets[i])
			
			assert.isTrue(regex.test(testDate), 'regex should match on output')
			assert.equal(testDate, trueDate[i], 'These dates should match exactly')
		}
	})
	
	it('should give back a valid date structure with no arguments', function() {
		let regex = new RegExp('[0-9]{14}')
		
		let testDate = timestamp()
		
		assert.isTrue(regex.test(testDate))
	})
	
	it('should be able to convert standard time zones when given offsets manually', function() {
		let regex = new RegExp('[0-9]{14}')
		for (let i = 6; i < trueDate.length; i++) {
			let testDate = timestamp(checkDates[6], checkOffsets[i])
			
			assert.isTrue(regex.test(testDate), 'regex should match on output')
			assert.equal(testDate, trueDate[i], 'These dates should match exactly')
		}
	})
})


