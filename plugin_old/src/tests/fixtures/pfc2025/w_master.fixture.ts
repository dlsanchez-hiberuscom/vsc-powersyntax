export const W_MASTER_FIXTURE = `
forward global type w_master from pfc_w_master
end type
end forward

global type w_master from pfc_w_master
end type
global w_master w_master

type variables
end variables

forward prototypes
public function string of_getexampletitle (string as_classname)
end prototypes

public function string of_getexampletitle (string as_classname);
integer li_rc
string ls_title
n_ds lds_titles
lds_titles = create n_ds
lds_titles.dataobject = "d_titles"
If lds_titles.of_settransobject (SQLCA) <> 1 Then Return "!"
li_rc = lds_titles.Retrieve (as_classname)
If li_rc < 0 Then
    return '!'
elseif li_rc = 0 Then
    return ""
Else
    ls_title = lds_titles.GetItemString (1, "title")
End If
Return ls_title
end function

event open;call super::open;
string ls_title
If this.ClassName ( ) = "w_examplemain" Then Return
If ( Pos ( this.title, "PFC Example" ) > 0 ) Then
    ls_title = of_GetExampleTitle ( this.ClassName ( ) )
    If ls_title <> '!' Then
        this.title = ls_title
    End If
End If
end event
`.trim();