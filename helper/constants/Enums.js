
module.exports = {
    ActivityFlag:
    {
        add: 1,
        edit: 2,
        delete: 3,
        de_active: 4
    },
    ErrorCode:
    {
        success: 0,
        updated: 1,
        failed: 2,
        exist: 3,
        not_exist: 4,
        exception: 5,
        not_verified: 6
    },

    HttpStatus:
    {
        ok: 200,
        bad_request: 400,
        not_found: 404,
        internal_server_error: 500,
    },
}