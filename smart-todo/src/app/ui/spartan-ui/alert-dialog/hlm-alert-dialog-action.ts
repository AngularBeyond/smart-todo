import { Directive, input } from '@angular/core';
import { BrnDialogClose } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

@Directive({
	selector: 'button[hlmAlertDialogAction]',
	hostDirectives: [BrnDialogClose, { directive: HlmButton, inputs: ['variant', 'size'] }],
	host: {
		'[type]': 'type()',
	},
})
export class HlmAlertDialogAction {
	public readonly type = input<'button' | 'submit' | 'reset'>('button');
}
