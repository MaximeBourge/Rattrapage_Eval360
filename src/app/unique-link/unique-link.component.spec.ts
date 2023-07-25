import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniqueLinkComponent } from './unique-link.component';

describe('UniqueLinkComponent', () => {
  let component: UniqueLinkComponent;
  let fixture: ComponentFixture<UniqueLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UniqueLinkComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UniqueLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
