<template>
  <div class="psa-page">
    <div class="psa-container">
      <div class="psa-header">
        <h1>晓聘付费协议</h1>
        <p class="psa-meta">
          <span>更新日期：2026年7月</span>
          <span>生效日期：2026年7月</span>
        </p>
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <div class="psa-body">
        <p>《晓聘付费协议》（以下简称"本协议"）是您（以下简称"用户"或"您"）与一诺晓聘（以下简称"我们"或"晓聘"）之间就晓聘平台付费服务所订立的协议。</p>
        <p>请您仔细阅读并充分理解本协议。本协议中与您的权益存在重大关系的条款（包括免除或限制责任的条款、争议解决条款等），请您留意重点查阅。您点击"立即购买"或实际进行支付，即视为您已阅读并同意本协议全部内容。</p>
        <p>本协议是《晓聘用户服务协议》的组成部分。本协议与《晓聘用户服务协议》约定不一致的，以本协议为准；本协议未约定或约定不明确的事项，以《晓聘用户服务协议》为准。</p>

        <div class="psa-toc">
          <p>本协议将帮助您了解以下内容：</p>
          <ul>
            <li><a href="#section1">一、付费服务概述</a></li>
            <li><a href="#section2">二、付费方式</a></li>
            <li><a href="#section3">三、服务使用与权益</a></li>
            <li><a href="#section4">四、发票</a></li>
            <li><a href="#section5">五、退款规则</a></li>
            <li><a href="#section6">六、免责声明</a></li>
            <li><a href="#section7">七、法律适用与争议解决</a></li>
            <li><a href="#section8">八、其他</a></li>
          </ul>
        </div>

        <section id="section1">
          <h2>一、付费服务概述</h2>
          <p>1.1 晓聘付费服务是晓聘平台为您提供的数字化服务，您可通过购买服务套餐的方式获取相应的平台使用权益。</p>
          <p>1.2 晓聘付费服务主要包括以下类别（具体以购买页面展示为准）：</p>
          <ul>
            <li>简历上传额度：用于在平台上上传和管理简历的数量额度；</li>
            <li>AI面试服务时长/次数：用于使用AI语音识别实时转写、AI面试报告生成等服务；</li>
            <li>其他增值服务：晓聘平台不时推出的其他付费功能或服务。</li>
          </ul>
          <p>1.3 晓聘有权根据产品计划和实际运营情况调整服务种类、价格及套餐内容。调整将以页面公告或购买页面展示的方式通知您，调整前已购买的套餐不受影响。</p>
        </section>

        <section id="section2">
          <h2>二、付费方式</h2>
          <p>2.1 您应通过晓聘平台接入的支付渠道依约支付相应费用后获取服务。具体以购买页面实际展示为准。</p>
          <p>2.2 您必须为所绑定支付渠道账户的开户人或合法持有人，可合法、有效使用该账户且未侵犯任何第三方权益。否则因此造成的损失和纠纷由您自行承担。</p>
          <p>2.3 您在购买时应仔细确认账号、支付账户、购买数量、购买费用等交易信息准确无误。如因您自身原因（包括但不限于账号错误、支付账户错误、操作不当等）导致的损失，由您自行承担。</p>
        </section>

        <section id="section3">
          <h2>三、服务使用与权益</h2>
          <p>3.1 您购买的付费服务自支付成功后即生效。不同套餐对应的服务内容、使用期限、使用次数或额度等，以购买页面展示的具体说明为准。</p>
          <p>3.2 服务权益仅限您本人账号使用，不得转让、转借或转售给任何第三方。</p>
          <p>3.3 您不得通过任何非官方渠道获取、售卖、转让积分或付费服务权益。晓聘有权对违规行为采取冻结账号、限制功能、终止服务等措施，并要求赔偿损失。</p>
          <p>3.4 付费服务期限届满后，您所享有的相应权益自动终止。如您的账户余额或服务次数耗尽，将无法继续使用对应的付费功能，您可选择再次购买。</p>
        </section>

        <section id="section4">
          <h2>四、发票</h2>
          <p>如需开具发票，请联系晓聘客服。我们将根据国家税务法规为您处理。</p>
        </section>

        <section id="section5">
          <h2>五、退款规则</h2>
          <p>晓聘付费服务属于在线使用的数字化商品。一经购买并开通，原则上不支持退款。请您在购买前充分了解服务内容，根据实际需求选择套餐。</p>
        </section>

        <section id="section6">
          <h2>六、免责声明</h2>
          <p>6.1 晓聘将尽最大努力为您提供付费服务的相关支持，但由于技术局限和不可抗力，晓聘无法保证网络服务绝对满足您的要求。因以下原因产生的损失，晓聘不承担责任：</p>
          <ul>
            <li>不可抗力（包括但不限于台风、地震、洪水、战争、罢工、传染病疫情、政府行为、网络病毒、黑客攻击、电信部门技术调整等）；</li>
            <li>由于与晓聘链接或合作的第三方支付渠道（如银行、支付宝、微信支付等）未尽安全监管义务所造成的账户信息泄露及由此导致的任何法律争议和后果；</li>
            <li>其他不应归责于晓聘的原因导致的损失。</li>
          </ul>
          <p>6.2 因您自身原因产生的损失，由您自行负责，包括但不限于：您未妥善保管账号密码或与他人共享账号；您使用的第三方支付账户存在异常或被冻结；您操作失误导致的充值错误等。</p>
          <p>6.3 晓聘对于非经晓聘指定途径或渠道获得的付费服务不承担任何义务或法律责任。</p>
        </section>

        <section id="section7">
          <h2>七、法律适用与争议解决</h2>
          <p>7.1 本协议的成立、生效、履行、解释及争议解决均适用中华人民共和国法律。</p>
          <p>7.2 如就本协议内容或执行发生任何争议，双方应友好协商解决；协商不成的，任何一方可将争议提交至被告所在地有管辖权的人民法院管辖。</p>
        </section>

        <section id="section8">
          <h2>八、其他</h2>
          <p>8.1 晓聘有权根据法律法规变化和业务需要修改本协议，修改后将通过页面公告、弹窗或其他合理方式通知您。如您不同意修改内容，您可停止购买付费服务；已购买的付费服务不受影响，继续按原约定执行至服务期届满。如您在修改生效后继续购买付费服务，即视为同意修改后的协议。</p>
          <p>8.2 如果您对本协议有任何疑问，请通过晓聘平台提供的联系方式联系我们。</p>
          <p><em>本协议可能存在多种语言版本，如各语言版本条款出现不一致或冲突，以中文版本为准。</em></p>
        </section>
      </div>

      <div class="psa-footer">
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/register')
  }
}
</script>

<style scoped lang="scss">
.psa-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.psa-container {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #dee0e3;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
}

.psa-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #3370ff;
  position: relative;

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1f2329;
    margin: 0 0 8px 0;
  }

  .psa-meta {
    display: flex;
    justify-content: center;
    gap: 24px;
    font-size: 14px;
    color: #8f959e;
    margin: 0;
  }

  .back-btn {
    position: absolute;
    left: 0;
    top: 0;
  }
}

.psa-toc {
  background: #fafbfc;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 32px;

  p {
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #1f2329;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      font-size: 14px;
      line-height: 1.8;

      a {
        color: #3370ff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

.psa-body {
  font-size: 15px;
  line-height: 1.8;
  color: #1f2329;

  > p {
    margin: 12px 0;
    text-align: justify;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2329;
    margin: 36px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e6eb;
  }

  p {
    margin: 8px 0;
    text-align: justify;
  }

  ul {
    margin: 8px 0;
    padding-left: 20px;

    li {
      margin: 6px 0;
      line-height: 1.7;
    }
  }
}

.psa-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
}

@media (max-width: 640px) {
  .psa-page {
    padding: 16px 8px;
  }

  .psa-container {
    padding: 24px 16px;
  }

  .psa-header {
    .psa-meta {
      flex-direction: column;
      gap: 4px;
    }

    .back-btn {
      position: static;
      display: block;
      margin-bottom: 12px;
    }
  }
}
</style>
