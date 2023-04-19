// const {enums} = require("enums");
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

    ResponseType:
    {
        nothing: 0,
        single: 1,
        list: 2
    },

    FeaturedType:
    {
        featured: 0,
        not_featured: 1,
    },

    RoleType:
    {
        customer: 0,
        employee: 1,
        reseptionist: 2,
        system_user: 3,
    },

    GetBookingType:
    {
        past: 0,
        current: 1,
        upcoming: 2,
        current_upcoming: 3,
    },

    HttpStatus:
    {
        ok: 200,
        bad_request: 400,
        not_found: 404,
        internal_server_error: 500,
    },
    OrderStatus:
    {
        ordered: 8,
        Confirmed: 9,
        in_Process: 10,
        Assign_to_rider: 11,
        Delivered: 12,
        Canceled: 13,
    },
    type:
    {
        Assign_to_rider: 15,
        Hold: 16,
        Sold: 17,
        Warehouse: 18,
        Order_in_process: 19,
    }

}