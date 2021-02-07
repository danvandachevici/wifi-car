const exec = require('child_process').execSync;
const express = require('express')
const app = express()
const port = 3000

app.use(express.static('site'));

const path = require('path');

try {
	exec('omega2-ctrl gpiomux set pwm0 pwm');
	exec('omega2-ctrl gpiomux set pwm1 pwm');
} catch(e) {
	console.log('Can not set PWM pins to be PWM type:', e);
}
app.get('/api/:path', (req, res) => {
    const action = req.params.path;
    console.log(`Got ${action} request`);
    takeAction(action);
    res.send("{status: 0}");
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

const DIRECTIONS = {
  forward: 0,
  backward: 1,
  left: 2,
  right: 3
}
const MOTORS = {
	left: 0,
	right: 1
}
const speed = 100;

var keypress = require('keypress');
//init();

const speedLevels = {
    left: 0,
    right: 0
};
const increment = 70;

function takeAction(action) {
    switch(action) {
		case 'up': run(DIRECTIONS.forward); break;
		case 'left': run(DIRECTIONS.left); break;
		case 'right': run(DIRECTIONS.right); break;
		case 'down': run(DIRECTIONS.backward); break;
		default: stop();
    }
}

//function init() {
//	// make `process.stdin` begin emitting "keypress" events
//	keypress(process.stdin);
//
//
//	process.stdin.setRawMode(true);
//	process.stdin.resume();
//
//	process.stdin.on('keypress', function (ch, key) {
//  		console.log('got "keypress"', key.name);
//		switch(key.name) {
//			case 'up': run(DIRECTIONS.forward); break;
//			case 'left': run(DIRECTIONS.left); break;
//			case 'right': run(DIRECTIONS.right); break;
//			case 'down': run(DIRECTIONS.backward); break;
//			default: stop();
//		}
//  		if (key && key.ctrl && key.name == 'c') {
//    		process.stdin.pause();
//  		}
//	});
//
//
//	console.log('Everything is up and running');
//}
//
//
const speed = 70;
function control(params) {

	// const goBackPinLeft = 1;
	// const goBackPinRight = 0;

	const frequency = 50;
	const dutyCycle = 60;

	const commands = [];

	const mapping = {
		left: [
			`fast-gpio pwm ${MOTORS.left} ${frequency} ${dutyCycle}`,
			`onion pwm ${MOTORS.left} 0 50 && fast-gpio set ${MOTORS.left} 0`,
			`onion pwm ${MOTORS.left} ${dutyCycle} ${frequency}`,
		],
		right: [
			`fast-gpio pwm ${MOTORS.right} ${frequency} ${dutyCycle}`,
			`onion pwm ${MOTORS.right} 0 50 && fast-gpio set ${MOTORS.right} 0`,
			`onion pwm ${MOTORS.right} ${dutyCycle} ${frequency}`,
		]
	};
	commands.push(mapping.left[params.left+1]);
	commands.push(mapping.right[params.right+1]);

	commands.forEach((cmd) => {
		try {
			exec(cmd);
		} catch(e) {
			console.log(`can't execute cmd:`, cmd);
		}
	})
}
function run(direction) {
	switch (direction) {
		case DIRECTIONS.right: {control({right: -1, left: 1}); break;}
		case DIRECTIONS.left: {control({right: 1, left: -1}); break;}
		case DIRECTIONS.forward: {control({right: 1, left: 1}); break;}
		case DIRECTIONS.backward: {control({right: -1, left: -1}); return;}
		default: {control({right: 0, left: 0})}
	}
}
function stop() {
	speedLevels.left = 0;
	speedLevels.right = 0;
	try {
		exec('onion pwm 0 0 50');
		exec('onion pwm 1 0 50');
	} catch(e) {
		console.log('Can not stop:', e);
	}
}
