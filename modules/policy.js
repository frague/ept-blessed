import { Draggable } from './draggable.js';
import { ConnectionPoint, connectionPointTypes } from './connection_point.js';
import { PolicyForm } from './policy_form.js';

const titleMaxWidth = 150;
export const policyWidth = 150;
export const policyHeight = 30;
const charWidth = 6;

export const clonePolicy = policy => {
	let clonedPolicy = Object.assign({}, policy);
	clonedPolicy.parameters = Object.assign({}, policy.parameters);
	return clonedPolicy;
}

export class Policy extends Draggable {
	wasMoved = false;
	isCloned = false;
	hasErrors = false;

	input = null;
	output = null;

	constructor(paper, position, data) {
		super(position);
		this.paper = paper;

		this.data = clonePolicy(data);
		this.validatePolicyParameters(this.data);
	}

	destructor() {
		this.linkedWith.forEach(linked => linked.destructor());
		this.group.remove();
		delete this;
	}

	clone() {
		return new Policy(this.paper, this.position, this.data);
	}

	addConnectionPoint(y, type, isStatic, isMulti) {
		let point = new ConnectionPoint(
			this.paper,
			{x: this.position.x + policyWidth / 2, y},
			type,
			isStatic,
			isMulti
		);
		this.group.push(point.render());
		this.linkWith(point);
		return point;
	}

	validatePolicyParameters(data) {
		this.hasErrors = Object.keys(data.parameters || {}).some(parameter => !data.parameters[parameter]);
		this.render();
	}

	addConnections() {
		let {x, y} = this.position;
		this.input = this.addConnectionPoint(y, connectionPointTypes.in, false, false);
		this.output = this.addConnectionPoint(y + policyHeight, connectionPointTypes.out, false, true);

		this.group.push(
			this.paper.image('/images/delete.png', x + policyWidth - 14, y + 2, 12, 12)
				.attr('cursor', 'hand')
				.click(() => {
					this.destructor();
				}),
			this.paper.image('/images/settings.png', x + policyWidth - 30, y + 2, 12, 12)
				.attr('cursor', 'hand')
				.click(() => {
					new PolicyForm(this.data, data => {
						this.data = data;
						this.validatePolicyParameters(data);
					})
						.render();
				})
		);
	}

	startDragging() {
		let policy = this.container.entity;
		if (!policy.wasMoved) {
			policy.clone().render();
			policy.wasMoved = true;
			policy.addConnections();
			policy.render();
		}
		super.startDragging();
	}

	updatePosition(dx, dy) {
		super.updatePosition(dx, dy);
		if (this.input) {
			this.input.updatePosition(dx, dy);
			this.output.updatePosition(dx, dy);
		}
	}

    _splitTitle(text) {
    	return text.split(' ').reduce((result, chunk, index) => {
    		if (!index) return chunk;
    		let width = (result.length + chunk.length) * charWidth;
    		return result + (width > titleMaxWidth ? '\n' : ' ') + chunk;
    	});
    }

    _determineColor() {
    	let color = '#EEE';
    	if (this.wasMoved) {
	    	if (this.hasErrors) {
	    		color = '#FAA';
	    	}
    	}
    	return color;
    }

	render() {
		if (!this.wasTouched) {
			let {x, y} = this.position;
			this.group = this.paper.set();
			if (this.isCloned) {
				let cRect = this.paper.rect(x + 4, y + 4, policyWidth, policyHeight)
				.attr({
			    	'fill': '#DDD',
			    	'stroke': '#000'
				});
				this.group.push(cRect);
			}
			this.rect = this.paper.rect(x, y, policyWidth, policyHeight)
				.attr({
			    	'stroke': '#000'
				});
			let text = this.paper.text(x + 5, y + policyHeight / 2, this._splitTitle(this.data.label))
				.attr({
					'text-anchor': 'start'
				});
			this.group.push(this.rect, text);
			this.makeDraggable(this.group);
		}
		this.rect.attr('fill', this._determineColor());
		super.render();
		return this.group;
	}
}