export class StorageConstants {
    static QUIRE = {
        ACCESS_TOKEN: "quire_access_token",
        REFRESH_TOKEN:  "quire_refresh_token",
        STATE: "quire_state",

        EXPIRES_IN: "quire_expires_in",
        EXPIRES_IN_DATE: "quire_expires_in_date",
        LOGGED_IN: "quire_logged_in",

        ALL_ORGANIZATIONS: "quire_all_organizations",
        ALL_PROJECTS: "quire_all_projects"
    };
    static SETTINGS = {
        DEFAULT_ORG_ID: "default_org_id",
        DEFAULT_PROJ_ID: "default_proj_id",
        DEFAULT_PROJ_URL: "default_proj_url",
        SITE_RULES: "site_project_rules",
        TAG_ALIASES: "tag_aliases",  // legacy global list, migrated into ADAPTERS
        ADAPTERS: "adapter_settings",
    };
    static LOGIN = {
        ATTEMPTING: 'login_attempting',
        TRIES: 'login_tries',
    };
    static TRUE = "true";
    static FALSE = "false";
    static CONFIG = {
        CONTEXT_MENU_IDS: 'config.context_menu_ids',
        LAST_KNOWN_VERSION: 'config.last_known_version',
    };
    static HISTORY = {
        ADDED_TASK_URL_MAP: 'history.added_task_url_map',
    }
}
