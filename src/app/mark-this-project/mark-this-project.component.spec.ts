import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkThisProjectComponent } from './mark-this-project.component';

describe('MarkThisProjectComponent', () => {
  let component: MarkThisProjectComponent;
  let fixture: ComponentFixture<MarkThisProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkThisProjectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarkThisProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
