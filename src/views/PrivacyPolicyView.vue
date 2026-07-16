<template>
  <div class="privacy-policy-page">
    <div class="pp-container">
      <div class="pp-header">
        <h1>晓聘隐私政策</h1>
        <p class="pp-meta">
          <span>更新日期：2026年7月</span>
          <span>生效日期：2026年7月</span>
        </p>
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <div class="pp-body">
        <p>一诺晓聘（以下简称"我们"或"晓聘"）重视您的个人信息和隐私保护。本政策说明您在使用晓聘网站及相关服务时，我们如何收集、使用、存储、共享和保护您的信息。</p>
        <p>如您不同意本政策，请停止使用需要处理个人信息的相关功能。您也可以通过我们的客服渠道联系我们，咨询、撤回授权、申请注销账号或处理个人信息相关请求。</p>

        <div class="pp-toc">
          <p>本政策将帮助您了解以下内容：</p>
          <ul>
            <li><a href="javascript:void(0)" @click="scrollTo('section1')">一、我们如何收集和使用信息</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section2')">二、权限调用说明</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section3')">三、我们如何使用Cookie和同类技术</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section4')">四、我们如何共享、转让和公开披露信息</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section5')">五、我们如何存储和保护信息</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section6')">六、您如何管理个人信息</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section7')">七、未成年人保护</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section8')">八、本政策如何更新</a></li>
            <li><a href="javascript:void(0)" @click="scrollTo('section9')">九、如何联系我们</a></li>
          </ul>
        </div>

        <section id="section1">
          <h2>一、我们如何收集和使用信息</h2>
          <p>我们坚持最小必要原则，只为提供简历管理、AI面试辅助、面试报告生成、账号安全、支付结算和服务改进所必需的目的处理信息。</p>

          <h3>1. 账号和登录信息</h3>
          <p>手机号、验证码验证结果、账号标识、登录状态、设备和网络日志，用于注册登录、账号安全、异常识别和服务连续性。</p>

          <h3>2. 简历信息</h3>
          <p>您主动上传、填写或导入的简历内容，包括姓名、手机号码、电子邮箱、性别、出生日期、教育经历、工作履历、项目经验、专业技能等。这些信息是开展面试评估所必需的数据。</p>

          <h3>3. 面试安排与记录信息</h3>
          <p>面试时间、地点、岗位、面试官信息等安排数据，以及面试过程中的文字评价记录。这些数据用于完成面试流程的管理与协作。</p>

          <h3>4. 音频和转写信息——AI面试辅助</h3>
          <p>当您启用AI面试功能并取得相关方同意后，我们会通过浏览器麦克风权限采集面试音频，并生成实时语音转写文本，用于识别面试问答内容、生成回答建议和AI评估报告。未开启相关功能时，我们不会使用麦克风采集音频。音频数据加密传输至语音识别服务商处理，处理完毕后即通知销毁。</p>

          <h3>5. 面试报告AI生成</h3>
          <p>基于简历信息和面试转写文本（经去标识化处理），我们通过AI大模型生成面试评估报告，辅助您进行评价和决策。AI报告仅供辅助参考。我们承诺不使用您的简历、音频和面试数据训练通用AI模型。</p>

          <h3>6. 知识库信息</h3>
          <p>您上传的岗位说明书、面试题库、制度文档等内容，用于辅助在面试过程中检索专业知识与岗位规范。</p>

          <h3>7. 支付和订单信息</h3>
          <p>订单号、支付渠道返回的支付状态、充值金额、消费记录、发票申请所需信息，用于完成支付、权益发放、异常排查和售后支持。具体支付相关信息的处理详见《晓聘付费协议》。</p>

          <h3>8. 设备和服务日志</h3>
          <p>设备型号、操作系统、浏览器类型、IP地址、访问时间、页面访问记录、性能和安全日志，用于保障服务稳定、安全审计、反作弊、防攻击和产品改进。</p>

          <h3>9. 依法无需同意的情形</h3>
          <p>根据法律法规，在以下情形中我们处理您的个人信息无需征得您的同意：为订立、履行合同所必需；为履行法定职责或法定义务所必需；与国家安全、国防安全直接相关；与公共安全、公共卫生、重大公共利益直接相关；与犯罪侦查、起诉、审判和判决执行直接相关；在合理范围内处理您自行公开的个人信息；法律法规规定的其他情形。</p>
        </section>

        <section id="section2">
          <h2>二、权限调用说明</h2>
          <p>麦克风权限仅用于您主动开启的AI面试录音、实时转写功能。文件或相册权限仅用于您主动上传简历、附件或截图场景。网络权限用于访问服务、完成登录和支付。</p>
          <p>您可以在系统设置中关闭相关权限。关闭后，对应功能可能无法使用，但不影响不依赖该权限的其他功能。</p>
        </section>

        <section id="section3">
          <h2>三、我们如何使用Cookie和同类技术</h2>
          <p>我们使用Cookie和同类技术以提升您的使用体验。当您使用本服务时，我们可能会使用相关技术向您的设备发送一个或多个Cookie或匿名标识符，以收集和存储您访问、使用服务时的信息。</p>
          <ul>
            <li><strong>必要Cookie：</strong>用于保障登录状态维持、权限验证、会话管理和安全防护。这些Cookie是提供服务所必需的，关闭将导致无法正常登录和使用。</li>
            <li><strong>统计与分析类Cookie：</strong>用于了解产品使用情况、优化用户体验。您可自主选择关闭。</li>
          </ul>
          <p>大多数浏览器均为用户提供了清除浏览器缓存数据的功能，您可以在浏览器设置功能中进行相应的数据清除操作。</p>
        </section>

        <section id="section4">
          <h2>四、我们如何共享、转让和公开披露信息</h2>
          <p class="pp-emphasis">我们不会出售您的个人信息。</p>

          <h3>（一）委托处理与共享</h3>
          <p>为完成登录验证、短信发送、支付结算、云存储、语音识别、AI模型生成、客服支持等必要服务，我们可能委托第三方服务商处理必要信息，主要包括：</p>
          <ul>
            <li>AI语音识别服务商：提供实时语音转文字服务，处理面试音频数据；</li>
            <li>AI大模型服务商：提供面试报告生成、简历分析等能力；</li>
            <li>云存储服务商：提供数据存储基础设施；</li>
            <li>支付服务商：提供支付渠道对接和交易处理。</li>
          </ul>
          <p>我们会要求上述第三方仅在约定目的和必要范围内处理信息，处理完毕后即销毁原始数据，不得留存、复用或用于自身模型训练，并采取相应保护措施。</p>
          <p>在以下情况下，我们可能依法共享或披露信息：获得您的明确同意；履行法律法规、司法或行政机关要求；处理安全事件、争议或维护您、我们及其他用户合法权益；公司合并、分立、收购、清算等导致个人信息转移且接收方继续受本政策约束。</p>

          <h3>（二）转让</h3>
          <p>如发生合并、分立、解散、收购、业务转让或破产清算等情形需要转让个人信息的，我们将向您告知接收方的名称和联系方式，并要求接收方继续履行我们的义务。如变更处理目的或方式，将重新取得您的同意。如无承接方，将对您的个人信息做删除或匿名化处理。</p>

          <h3>（三）公开披露</h3>
          <p>我们不会对外公开披露您的个人信息。如必须公开披露，将向您告知披露目的、信息类型，并征得您的明示同意。</p>
        </section>

        <section id="section5">
          <h2>五、我们如何存储和保护信息</h2>

          <h3>（一）存储地点与期限</h3>
          <p>我们会将在中国境内运营过程中收集和产生的个人信息存储于中华人民共和国境内。如未来因业务需要确需跨境传输，我们将严格依照法律规定完成安全评估或签订标准合同并提前告知您。</p>
          <p>我们仅在实现本政策所述目的所需的期限内保存信息。具体留存期限如下：</p>
          <ul>
            <li>账号信息：账号存续期间保留，注销后15日内删除；</li>
            <li>简历、面试录音及AI评估报告：账号存续期间保留，注销后30日内全部删除或销毁；</li>
            <li>系统日志及设备信息：留存90天；</li>
            <li>支付订单及消费记录：按税务法规要求留存；</li>
            <li>客户咨询工单：留存3年。</li>
          </ul>
          <p>超出保存期限后，我们将删除或匿名化处理相关信息。法律法规另有规定的，从其规定。</p>

          <h3>（二）安全措施</h3>
          <p>我们采取访问控制、加密传输（TLS协议）、加密存储（AES-256）、权限隔离、日志审计、安全监控等措施保护信息安全。我们按最小权限原则设计访问控制，运维人员操作全程留痕审计。我们定期进行安全评估和漏洞扫描，并通过员工保密协议和安全培训加强内部管理。</p>

          <h3>（三）安全事件处置</h3>
          <p>若发生个人信息泄露等安全事件，我们将立即启动应急预案，阻止安全事件扩大，并在72小时内通过短信、邮件、系统公告等方式告知受影响的用户，同时按照法律法规要求上报监管部门。</p>
        </section>

        <section id="section6">
          <h2>六、您如何管理个人信息</h2>
          <p>您可以在产品内查看、修改部分账号资料；也可以通过我们的客服渠道，申请查阅、复制、更正、删除您的个人信息、撤回授权或注销账号。为保障账号安全，我们可能需要先验证您的身份。我们将在收到请求后15个工作日内响应。</p>
          <ul>
            <li><strong>撤回授权：</strong>对于基于同意处理的个人信息（特别是面试录音等敏感信息），您有权随时撤回同意，撤回不影响撤回前已基于同意进行的处理活动的效力。撤回后，对应的功能将受限。</li>
            <li><strong>删除申请：</strong>如需删除您的个人信息，可通过客服渠道直接联系我们。我们将在10个工作日内处理。</li>
            <li><strong>账户注销：</strong>您可通过晓聘客服申请注销。注销后我们将在15日内删除或匿名化您的个人信息。法律、行政法规另有规定的除外。</li>
          </ul>
          <p>在以下情形中，按照法律法规要求，我们将无法响应您的请求：与国家安全、国防安全直接相关的；与公共安全、公共卫生、重大公共利益直接相关的；与犯罪侦查、起诉、审判和判决执行直接相关的；有充分证据表明您存在主观恶意或滥用权利的；响应请求将导致您或其他个人、组织的合法权益受到严重损害的；涉及商业秘密的。</p>
        </section>

        <section id="section7">
          <h2>七、未成年人保护</h2>
          <p>晓聘主要面向成年人用户。我们不会有意收集未满14周岁未成年人的个人信息。若我们发现误收集了未成年人信息，将在72小时内完成全量删除并留存处置记录。若您是未成年人的监护人，对相关信息处理有疑问，请通过本政策公示的联系方式联系我们。</p>
        </section>

        <section id="section8">
          <h2>八、本政策如何更新</h2>
          <p>我们可能根据产品功能、法律法规或服务运营情况更新本政策。重大变更（包括扩大信息收集范围、新增第三方共享对象、变更敏感信息使用方式、涉及数据跨境传输等）会通过网站弹窗、公告或其他合理方式提示，需您手动勾选同意后方可继续使用。更新后的政策发布后即生效。如您不同意更新，您有权注销账户。</p>
        </section>

        <section id="section9">
          <h2>九、如何联系我们</h2>
          <p>一诺晓聘</p>
          <ul>
            <li>联系电话：15997535900</li>
          </ul>
          <p>如对本政策或个人信息处理有任何疑问、意见或投诉，请通过上述方式与我们联系。我们将在法律法规要求的期限内处理并回复。</p>
        </section>
      </div>

      <div class="pp-footer">
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

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped lang="scss">
.privacy-policy-page {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 40px 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.pp-container {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #dee0e3;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(31, 35, 41, 0.04);
}

.pp-header {
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

  .pp-meta {
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

.pp-toc {
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

  ol {
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

.pp-body {
  font-size: 15px;
  line-height: 1.8;
  color: #1f2329;

  > p {
    margin: 12px 0;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2329;
    margin: 36px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e6eb;
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2329;
    margin: 20px 0 8px 0;
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

  .pp-emphasis {
    font-weight: 600;
    color: #3370ff;
  }
}

.pp-footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
}

@media (max-width: 640px) {
  .privacy-policy-page {
    padding: 16px 8px;
  }

  .pp-container {
    padding: 24px 16px;
  }

  .pp-header {
    .pp-meta {
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
