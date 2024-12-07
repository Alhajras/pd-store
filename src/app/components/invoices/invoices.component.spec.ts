import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesComponent } from './invoices.component';

describe('ToOrderTableComponent', () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InvoicesComponent]
    });
    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
