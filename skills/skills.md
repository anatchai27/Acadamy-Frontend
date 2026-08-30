# JavaScript/ES6 Coding Standard (Front + LineLiff)

มาตรฐานนี้ใช้กับโค้ดใน `Front/src` และ `LineLiff/src`

## 1) Variable Declaration
- ห้ามใช้ `var`
- ใช้ `const` เป็นค่าเริ่มต้น
- ใช้ `let` เฉพาะกรณีที่ต้องเปลี่ยนค่า

## 2) Functions
- ใช้ Arrow Function (`=>`) เป็นมาตรฐานหลัก
- หลีกเลี่ยง `function` declaration ยกเว้นมีเหตุผลด้านความชัดเจน/hoisting

## 3) String Interpolation
- ใช้ Template Literal (`` `...${value}...` ``) แทนการต่อสตริงด้วย `+`

## 4) Default Parameters
- ฟังก์ชันที่รับค่า optional ต้องกำหนดค่า default

## 5) Destructuring
- ใช้ object/array destructuring เมื่ออ่านหลายค่าใน object/array เดียวกัน

## 6) Spread Operator
- ใช้ `...` สำหรับ clone/merge object และ array

## 7) Rest Parameters
- ใช้ `...args` เมื่อต้องรับพารามิเตอร์จำนวนไม่แน่นอน

## 8) Object Property Shorthand
- ถ้าชื่อ key และตัวแปรเหมือนกัน ให้เขียนแบบ shorthand
- ตัวอย่าง: `{ name, age }` แทน `{ name: name, age: age }`

## 9) Async Flow
- ใช้ `async/await` เป็นหลัก
- อนุญาต `.then()` ได้เมื่อ chain สั้นและอ่านง่าย แต่ไม่ควรผสมหลายรูปแบบในบล็อกเดียว

## 10) Array Processing
- ใช้ `map`, `filter`, `find`, `reduce` แทน loop แบบ imperative เท่าที่เหมาะสม
- `for...of` ใช้ได้ในกรณี break/continue หรือ logic ซับซ้อนกว่า method chain

## Team Review Checklist (ก่อน merge)
- [ ] ไม่มี `var`
- [ ] ฟังก์ชันใหม่ใช้ Arrow Function
- [ ] ไม่มีการต่อสตริงด้วย `+` ในข้อความ UI/API message
- [ ] มี default param สำหรับ optional args
- [ ] ใช้ destructuring/shorthand เมื่อเหมาะสม
- [ ] งาน async ใหม่ใช้ `async/await` เป็นหลัก
- [ ] ใช้ array methods แทน loop แบบเดิมเมื่อไม่เสียความชัดเจน
