let arr = {
    '123': [
        'abc',
        'def',
        'ghi'
    ],
    '345': [
        'asdlkfj',
        'liadhjflakdj',
        'asdiofhaklsdfja'
    ]
}

// Object.keys(lunch).forEach(function (item) {
// 	console.log(item); // key
// 	console.log(lunch[item]); // value
// });

var something = Object.keys(arr).map(m => arr[m])

console.log([].concat(...something))