global type w_report_smoke from window
end type

event open();
  dw_parent.DataObject = "d_parent_report_smoke"
  dw_parent.Modify("rpt_orders.")
  dw_parent.Describe("rpt_orders.status_id.dddw.name")
end event