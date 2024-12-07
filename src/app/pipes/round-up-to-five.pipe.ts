import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roundUpToFive',
  standalone: true, 
})
export class RoundUpToFivePipe implements PipeTransform {

  transform(value: number): number {
    if (typeof value !== 'number') {
      throw new Error('Invalid input: value must be a number');
    }
    return Math.ceil(value / 5) * 5;
  }
}
