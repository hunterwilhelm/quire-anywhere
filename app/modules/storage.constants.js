export class StorageConstants {
    static QUIRE = {
        ACCESS_TOKEN: "quire_access_token",
        REFRESH_TOKEN:  "quire_refresh_token",
        STATE: "quire_state",

        EXPIRES_IN: "quire_expires_in",
        EXPIRES_IN_DATE: "quire_expires_in_date",
        LOGGED_IN: "quire_logged_in",
    };
    static SETTINGS = {
        DEFAULT_ORG_ID: "default_org_id",
        DEFAULT_ORG_NAME: "default_org_name",
        DEFAULT_PROJ_ID: "default_proj_id",
        DEFAULT_PROJ_NAME: "default_proj_name",
    };
    static ATTEMPT_LOGIN = {
        ATTEMPTING: 'attempt_login_attempting',
        ID: 'attempt_login_id',
        TRIES: 'attempt_login_tries',
    };
    static TRUE = "true";
    static FALSE = "false";
}
