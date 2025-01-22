import { Pipe, PipeTransform } from '@angular/core'
@Pipe({
  name: 'datetodays',
  pure: false,
  standalone: true
})

export class DateToDaysPipe implements PipeTransform {
  public transform (value?: string | null): number {
    if (value === null || value === undefined) {
      return 0
    }
    const d = new Date(value)
    const now = new Date()
    const seconds = Math.round(Math.abs((now.getTime() - d.getTime()) / 1000))
    const minutes = Math.round(Math.abs(seconds / 60))
    const hours = Math.round(Math.abs(minutes / 60))
    const days = Math.round(Math.abs(hours / 24))
    return days
    
  }
}