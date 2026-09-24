import { onRequestDelete as __api_admin_player_js_onRequestDelete } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/admin/player.js"
import { onRequestGet as __api_admin_player_js_onRequestGet } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/admin/player.js"
import { onRequestPost as __api_admin_player_js_onRequestPost } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/admin/player.js"
import { onRequestGet as __api_admin_players_js_onRequestGet } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/admin/players.js"
import { onRequestDelete as __api_profile__game__js_onRequestDelete } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/profile/[game].js"
import { onRequestGet as __api_profile__game__js_onRequestGet } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/profile/[game].js"
import { onRequestPost as __api_profile__game__js_onRequestPost } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/profile/[game].js"
import { onRequestDelete as __api_account_index_js_onRequestDelete } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/account/index.js"
import { onRequestPost as __api_account_index_js_onRequestPost } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/account/index.js"
import { onRequestGet as __api_admin_index_js_onRequestGet } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/admin/index.js"
import { onRequestGet as __api_auth_index_js_onRequestGet } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/auth/index.js"
import { onRequestPost as __api_auth_index_js_onRequestPost } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/auth/index.js"
import { onRequestGet as __api_profile_index_js_onRequestGet } from "/Users/emil/Documents/GitHub/spillarena/SpillArena/functions/api/profile/index.js"

export const routes = [
    {
      routePath: "/api/admin/player",
      mountPath: "/api/admin",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_player_js_onRequestDelete],
    },
  {
      routePath: "/api/admin/player",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_player_js_onRequestGet],
    },
  {
      routePath: "/api/admin/player",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_player_js_onRequestPost],
    },
  {
      routePath: "/api/admin/players",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_players_js_onRequestGet],
    },
  {
      routePath: "/api/profile/:game",
      mountPath: "/api/profile",
      method: "DELETE",
      middlewares: [],
      modules: [__api_profile__game__js_onRequestDelete],
    },
  {
      routePath: "/api/profile/:game",
      mountPath: "/api/profile",
      method: "GET",
      middlewares: [],
      modules: [__api_profile__game__js_onRequestGet],
    },
  {
      routePath: "/api/profile/:game",
      mountPath: "/api/profile",
      method: "POST",
      middlewares: [],
      modules: [__api_profile__game__js_onRequestPost],
    },
  {
      routePath: "/api/account",
      mountPath: "/api/account",
      method: "DELETE",
      middlewares: [],
      modules: [__api_account_index_js_onRequestDelete],
    },
  {
      routePath: "/api/account",
      mountPath: "/api/account",
      method: "POST",
      middlewares: [],
      modules: [__api_account_index_js_onRequestPost],
    },
  {
      routePath: "/api/admin",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_index_js_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_index_js_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_index_js_onRequestPost],
    },
  {
      routePath: "/api/profile",
      mountPath: "/api/profile",
      method: "GET",
      middlewares: [],
      modules: [__api_profile_index_js_onRequestGet],
    },
  ]