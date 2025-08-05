+++
date = '2025-06-25T16:35:27+06:30'
draft = false
title = 'Search in this Site'

[params.section]
    add = 'search'
+++

**အသတ်-အောက်ကမြင့်** (့်) ကို **အောက်ကမြင့်-အသတ်** (့်) လို့ ရိုက်ပြီးရှာပါ။ ဥပမာ **ခကွေး-ဝဆွဲ-င-အသတ်-အောက်ကမြင့်** (ခွင့်) ကို **ခကွေး-ဝဆွဲ-င-အောက်ကမြင့်-အသတ်** (ခွင့်) လို့ ရိုက်ပြီးရှာပါ။

{{< inner-html >}}
<div id="search"></div>
<script>
    window.addEventListener('DOMContentLoaded', (event) => {
        new PagefindUI({
            element: "#search",
            showSubResults: true,
            showImages: false,
            pageSize: 9
            });
    });
</script>
{{< /inner-html >}}