const exec = require('child_process').execSync;
const express = require('express');
const app = express();
const port = 3000;

const DIRECTIONS = {
  forward: {left: 1, right: 1},
  backward: {left: -1, right: -1},
  left: {left: -1, right: 1},
  right: {left: 1, right: -1}
};
const MOTORS = {
	left: 0,
	right: 1
};

app.use(express.static('site'));

// go back
control(DIRECTIONS.backward);
setTimeout(() => {
  stop();
}, 3000);

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
});

function takeAction(action) {
    switch(action) {
		case 'up': control(DIRECTIONS.forward); break;
		case 'left': control(DIRECTIONS.left); break;
		case 'right': control(DIRECTIONS.right); break;
		case 'down': control(DIRECTIONS.backward); break;
		default: stop();
    }
}

function control(params) {

	const frequency = 50;
	const dutyCycle = 60;

	const commands = [];

	const mapping = {
		left: [
      // BACKWARD
			`onion pwm ${MOTORS.left} 0 ${frequency} && fast-gpio pwm ${MOTORS.left} ${frequency} ${dutyCycle}`,
      // STOP
			`onion pwm ${MOTORS.left} 0 ${frequency} && fast-gpio set ${MOTORS.left} 0`,
      // FORWARD
			`fast-gpio set ${MOTORS.left} 0 && onion pwm ${MOTORS.left} ${dutyCycle} ${frequency}`,
		],
		right: [
      // BACKWARD
			`onion pwm ${MOTORS.right} 0 ${frequency} && fast-gpio pwm ${MOTORS.right} ${frequency} ${dutyCycle}`,
      // STOP
			`onion pwm ${MOTORS.right} 0 ${frequency} && fast-gpio set ${MOTORS.right} 0`,
      // FORWARD
			`fast-gpio set ${MOTORS.right} 0 && onion pwm ${MOTORS.right} ${dutyCycle} ${frequency}`,
		]
	};

  const cmd = `${mapping.left[params.left+1]} && ${mapping.right[params.right+1]}`;

	console.log('Commands', cmd);

  try {
    exec(cmd);
  } catch(e) {
    console.log(`can't execute cmd:`, cmd);
  }
}

function stop() {
	try {
		exec(`onion pwm ${MOTORS.left} 0 50`);
		exec(`onion pwm ${MOTORS.right} 0 50`);
    exec(`fast-gpio set ${MOTORS.left} 0`);
    exec(`fast-gpio set ${MOTORS.right} 0`);
	} catch(e) {
		console.log('Can not stop:', e);
	}
}
