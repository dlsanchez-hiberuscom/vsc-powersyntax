forward
global type w_main from window
end type
end forward

global type w_main from window
integer width = 2000
integer height = 1500
string title = "Main Window"
end type

type cb_ok from commandbutton within w_main
integer x = 100
integer y = 200
end type

on w_main.create
    this.cb_ok = create cb_ok
end on

event open;
    string ls_message
    integer li_count
    ls_message = "Hello"
    li_count = 0
    MessageBox("Info", ls_message)
end event

public function integer of_process (string as_input);
    integer li_result
    if IsNull(as_input) then
        li_result = -1
    else
        li_result = Len(as_input)
    end if
    return li_result
end function

public subroutine of_reset ();
    // reset logic
end subroutine

event clicked;
    of_process("test")
end event
