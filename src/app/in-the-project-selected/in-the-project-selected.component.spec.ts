import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InTheProjectSelectedComponent } from './in-the-project-selected.component';

describe('InTheProjectSelectedComponent', () => {
  let component: InTheProjectSelectedComponent;
  let fixture: ComponentFixture<InTheProjectSelectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InTheProjectSelectedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InTheProjectSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
