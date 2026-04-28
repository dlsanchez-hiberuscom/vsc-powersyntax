export const M_RTEFRAME_FIXTURE = `
forward global type m_rteframe from m_master
end type
type m_retrievedocument from menu within m_file
end type
type m_- from menu within m_tools
end type
end forward

global type m_rteframe from m_master
end type
global m_rteframe m_rteframe

on m_rteframe.create m_rteframe=this call super::create end on
on m_rteframe.destroy call super::destroy end on

type m_file from m_master\`m_file within m_rteframe
    m_retrievedocument m_retrievedocument
end type

event m_find::clicked;call super::clicked;
of_SendMessage ("ue_finddlg")
end event

event m_replace::clicked;call super::clicked;
of_SendMessage ("ue_replacedlg")
end event
`.trim();