import { LightningElement } from 'lwc';

export default class LwcButton extends LightningElement {
    handleClick(event) {
        this.clickedButtonLabel = event.target.label;
    }
}