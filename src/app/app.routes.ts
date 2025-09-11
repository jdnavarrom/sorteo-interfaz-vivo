import { Routes } from '@angular/router';
export const routes: Routes = [

  { path: "", redirectTo: "/sorteos", pathMatch: "full" },
  { path: "sorteos", loadComponent: () => import("../app.component").then((m) => m.AppComponent) },

];
