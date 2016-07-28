
$(function() {
var str = '<?xml version="1.0" encoding="utf-8"?><Persons><Person FullName="Bill Gates"><Corporation>Microsoft</Corporation><Description>The largest software company</Description><Products>Windows series OS, SQL Server Database, XBox 360...</Products></Person><Person FullName="Jobs"><Corporation>Apple</Corporation><Description>The famous software company</Description><Products>Macintosh, iPhone, iPod, iPad...</Products></Person><Person FullName="Larry Page"><Corporation>Google</Corporation><Description>the largest search engine</Description><Products>Google search, Google Adsense, Gmail...</Products></Person></Persons>';
var xmlData = $.parseXML(str);

/* 我们要讲得到的数据放入一个表格里面，这里定义一个表格字符窜 */
var htmlData = "<table border='1'>";

 /* 找到 Person 元素，然后用 each 方法进行遍历 */
 $(xmlData).find("Person").each(function() {
  var Person = $(this); /* 将当前元素复制给 Person */
  var FullName = Person.attr("FullName"); /* 获取 Person 的 FullName 属性 */
  var Corporation = Person.find("Corporation").text(); /* 获取 Person 中子元素 Corporation 的值 */
  var Description = Person.find("Description").text(); /* 获取 Person 中子元素 Description 的值 */
  var Products = Person.find("Products").text(); /* 获取 Person 中子元素 Products 的值 */
  /* 将得到的数据，放到表格的一行中 */
  htmlData += "<tr>";
  htmlData += " <td>" + FullName + "</td>";
  htmlData += " <td>" + Corporation + "</td>";
  htmlData += " <td>" + Description + "</td>";
  htmlData += " <td>" + Products + "</td>";
  htmlData += "</tr>";
 });
 
 //完成表格字符窜
 htmlData += "</table>";
 //将表格放到 body 中
 $("body").append(htmlData);
/* var field = $(this);
   var fName = field.attr("Name");//读取节点属性
   var dataType = field.find("datatype").text();//读取子节点的值
*/
 /*修改xml：为指定节点添加子节点*/
 $(xmlData).find("Persons").append('<Person FullName="老王"><Corporation>王氏集团</Corporation><Description>The largest software company</Description><Products>Windows series OS, SQL Server Database, XBox 360...</Products></Person>');;
 
 /*修改xml：删除指定节点*/
 $(xmlData).find("Person")[0].remove();
 
 /*修改xml：修改节点的值*/
 /*$("#id").text();//获取节点值
 $("#id").text("newValue");//为节点赋值
*/ 
$($(xmlData).find("Person")[0]).find("Description").text("这个公司不生产android智能手机和平板");
 /* 将修改后的数据放入一个表格里面 */
 var htmlData1 = "<table border='1'>";
  /* 找到 Person 元素，然后用 each 方法进行遍历 */
  $(xmlData).find("Person").each(function() {
   var Person = $(this); /* 将当前元素复制给 Person */
   var FullName = Person.attr("FullName"); /* 获取 Person 的 FullName 属性 */
   var Corporation = Person.find("Corporation").text(); /* 获取 Person 中子元素 Corporation 的值 */
   var Description = Person.find("Description").text(); /* 获取 Person 中子元素 Description 的值 */
   var Products = Person.find("Products").text(); /* 获取 Person 中子元素 Products 的值 */
   /* 将得到的数据，放到表格的一行中 */
   htmlData1 += "<tr>";
   htmlData1 += " <td>" + FullName + "</td>";
   htmlData1 += " <td>" + Corporation + "</td>";
   htmlData1 += " <td>" + Description + "</td>";
   htmlData1 += " <td>" + Products + "</td>";
   htmlData1 += "</tr>";
  });
  
  //完成表格字符窜
  htmlData1 += "</table>";
  //将表格放到 body 中
  $("body").append(htmlData1);
});
