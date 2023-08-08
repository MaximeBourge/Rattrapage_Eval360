import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Eval360PageComponent } from './eval360-page.component';

describe('Eval360PageComponent', () => {
  let component: Eval360PageComponent;
  let fixture: ComponentFixture<Eval360PageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Eval360PageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Eval360PageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
