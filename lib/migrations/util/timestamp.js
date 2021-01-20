function yyyymmddhhmmss(...time) {
	const rYear = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	const timeZones = {
		'60':   'ECT', '120':  'EET', '180':  'EAT', '210':  'MET',
		'240':  'NET', '300':  'PLT', '330':  'IST', '360':  'BST',
		'420':  'VST', '480':  'CTT', '540':  'JST', '570':  'ACT',
		'600':  'AET', '660':  'SST', '720':  'NST', '-660': 'MIT',
		'-600': 'HST', '-540': 'AST', '-480': 'PST', '-420': 'MST',
		'-360': 'CST', '-300': 'EST', '-240': 'PRT', '-210': 'CNT',
		'-180': 'BET', '-60':  'CAT'
	}
	
	let d = new Date()
	let offset = d.getTimezoneOffset()
	if (time.length > 0) {
		//'2016-02-28T21:12:45.678'
		const timeRegex = new RegExp('[0-9]{4}-[0-9]{2}-[0-9]{2}T([0-9]{2}:){2}[0-9]{2}\\.[0-9]{3}')
		const offsetRegex = new RegExp('[0-9]{2,3}')
		if (timeRegex.test(time[0]) && offsetRegex.test(time[1])) {
			d = new Date(time[0])
			offset = time[1]
			if (offset > 841 || offset < -841) {
				offset = 0;
			}
		}
	}
	
	const dateTime = [d.getMinutes() + offset, d.getHours(), d.getDate()-1, d.getMonth(), d.getFullYear()];
	let forward = false;
	
	for (let i = 0; i < 4; i++) {
		const unitCeil = (i === 0 ? 59 : (i === 1 ? 23 : (i === 2 ? rYear[dateTime[3]]-1 : (i === 3 ? 11 : 400000))))
		while(dateTime[i] > unitCeil || dateTime[i] < 0) {
			if (dateTime[i] < 0) {
				dateTime[i+1] -= 1
				if (i === 2) {
					if (dateTime[3] < 0) {
						dateTime[i] += 31
					} else {
						dateTime[i] += (rYear[dateTime[3]])
					}
				} else {
					dateTime[i]   += (unitCeil+1)
				}
			} else if (dateTime[i] > unitCeil) {
				if (i === 2) {
					dateTime[i]   -= (rYear[dateTime[3]])
				} else {
					dateTime[i]   -= (unitCeil+1)
				}
				dateTime[i+1] += 1
				forward = true
			}
		}
	}
	
	dateTime[2]++;
	dateTime[3]++;
	
	if ((dateTime[4]%4 !== 0) && (dateTime[2] === 29) && (dateTime[3] === 2)) {
		if (forward) {
			dateTime[3] = 3
			dateTime[2] = 1
		} else {
			dateTime[3] = 2
			dateTime[2] = 28
		}
	}
	
	return (
		//zoneName +
		dateTime[4].toString() +
		dateTime[3].toString().padStart(2, '0') +
		dateTime[2].toString().padStart(2, '0') +
		dateTime[1].toString().padStart(2, '0') +
		dateTime[0].toString().padStart(2, '0') +
		d.getSeconds().toString().padStart(2, '0')
	);
}

module.exports = { yyyymmddhhmmss };
