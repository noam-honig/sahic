import { RemultModule } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { UsersComponent } from './users/users.component';
import { AdminGuard } from './users/AdminGuard';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { JwtModule } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';
import { terms } from './terms';
import { AttendanceComponent } from './attendance/attendance.component';
import { MilgaiComponent } from './milgai/milgai.component';
import { TestComponent } from './test/test.component';

const defaultRoute = 'links';
const routes: Routes = [
  { path: 'test', component: TestComponent },
  { path: defaultRoute + '/:id', component: HomeComponent },
  { path: defaultRoute, component: HomeComponent },
  { path: 'a/:id', component: AttendanceComponent },
  { path: 'm/:id', component: MilgaiComponent },
  {
    path: terms.userAccounts,
    component: UsersComponent,
    canActivate: [AdminGuard],
  },
  { path: '**', redirectTo: '/' + defaultRoute, pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    RemultModule,
    JwtModule.forRoot({
      config: { tokenGetter: () => AuthService.fromStorage() },
    }),
  ],
  providers: [
    AdminGuard,
    { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler },
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
