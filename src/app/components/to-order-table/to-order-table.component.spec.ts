import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToOrderTableComponent } from './to-order-table.component';

describe('ToOrderTableComponent', () => {
  let component: ToOrderTableComponent;
  let fixture: ComponentFixture<ToOrderTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ToOrderTableComponent]
    });
    fixture = TestBed.createComponent(ToOrderTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
